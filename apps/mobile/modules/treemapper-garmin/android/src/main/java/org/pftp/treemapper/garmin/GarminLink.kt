package org.pftp.treemapper.garmin

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.garmin.android.connectiq.ConnectIQ
import com.garmin.android.connectiq.IQApp
import com.garmin.android.connectiq.IQDevice
import com.garmin.android.connectiq.exception.InvalidStateException
import com.garmin.android.connectiq.exception.ServiceUnavailableException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Everything that talks to the Garmin device.
 *
 * This is a port of `android-demo/.../WatchLink.kt` in the treemapper-garmin
 * repo, which is the bench harness the protocol was developed against. The
 * shape is kept close on purpose, so a problem found with one can be checked
 * against the other.
 *
 * Three things about this SDK are worth knowing before reading further:
 *
 *  1. **Nothing may be called before `onSdkReady()`.** Calling early throws
 *     `InvalidStateException`, and it is easy to do by accident.
 *  2. **In WIRELESS mode every call routes through Garmin Connect Mobile.**
 *     If that app is missing, signed out, or the device is not paired to it,
 *     calls fail with `ServiceUnavailableException`. That is a user problem
 *     with a user fix, so it is surfaced as a blocker rather than swallowed.
 *  3. **Callbacks arrive on a background thread.** Everything here hops to the
 *     main thread before emitting, so the JavaScript side never has to think
 *     about it.
 *
 * Everything leaves here as a `Bundle` shaped like the `GarminLinkEvent` union
 * in `src/garmin/transport.ts`. Inbound device messages are emitted raw and
 * unparsed: the parser lives in `src/garmin/protocol.ts` and is shared with the
 * development mock, so there is exactly one place where a wire format change
 * has to be understood.
 */
class GarminLink(
    private val context: Context,
    private val emit: (Bundle) -> Unit
) {

    private val main = Handler(Looper.getMainLooper())

    /**
     * Every ConnectIQ call that can touch the wire runs here, never on the
     * main thread.
     *
     * Over the tethered transport the SDK writes to the ADB socket
     * **synchronously on the calling thread**. Android forbids network I/O on
     * the main thread, so a send from a JS call would die instantly with
     * NetworkOnMainThreadException and the message would never go out.
     *
     * In WIRELESS mode the same call is a Binder round trip to Garmin Connect
     * rather than a socket write, so it happens not to trip the check. Routing
     * both through here costs nothing and removes the difference.
     */
    private val io: ExecutorService = Executors.newSingleThreadExecutor()

    private var connectIQ: ConnectIQ? = null
    private var sdkReady = false
    private var connectType = ConnectIQ.IQConnectType.WIRELESS
    private var device: IQDevice? = null
    private var listeningForApp = false
    private var listeningForDeviceId: Long? = null
    private var lastConnected = false
    private var started = false

    private val watchApp = IQApp(WATCH_APP_ID)

    /** The id the Connect IQ simulator actually uses over ADB: empty. */
    private val simulatorApp = IQApp("")

    private val tethered: Boolean
        get() = connectType == ConnectIQ.IQConnectType.TETHERED

    /** The app object this transport routes by. See listenForMessages(). */
    private fun outboundApp(): IQApp = if (tethered) simulatorApp else watchApp

    // ---- events ----------------------------------------------------------

    private fun log(line: String) = emit(Bundle().apply {
        putString("type", "log")
        putString("line", line)
    })

    private fun emitSdk(ready: Boolean, detail: String) = emit(Bundle().apply {
        putString("type", "sdk")
        putBoolean("ready", ready)
        putString("detail", detail)
    })

    private fun emitDevice(name: String?, connected: Boolean) = emit(Bundle().apply {
        putString("type", "device")
        putString("name", name)
        putBoolean("connected", connected)
    })

    private fun emitApp(installed: Boolean?, detail: String) = emit(Bundle().apply {
        putString("type", "app")
        if (installed == null) {
            putString("installed", null)
        } else {
            putBoolean("installed", installed)
        }
        putString("detail", detail)
    })

    /**
     * A dead end the user has to fix. `reason` is one of the GarminBlocker
     * strings in transport.ts, and each one gets its own words on the phone.
     */
    private fun emitBlocked(reason: String, detail: String) = emit(Bundle().apply {
        putString("type", "blocked")
        putString("reason", reason)
        putString("detail", detail)
    })

    private fun emitMessage(payload: Map<String, Any?>) = emit(Bundle().apply {
        putString("type", "message")
        putBundle("payload", toBundle(payload))
    })

    // ---- lifecycle -------------------------------------------------------

    /**
     * @param useTethered talk to the Connect IQ simulator over an
     *   ADB-forwarded socket instead of to a real device through Garmin
     *   Connect. Development only, and the module refuses it in a release
     *   build. Run `adb forward tcp:7381 tcp:7381` first, start this, then
     *   Connection > Start in the simulator: the phone must be listening
     *   before the simulator dials in.
     */
    fun start(useTethered: Boolean) {
        if (started) {
            log("already started; ignoring")
            return
        }
        started = true
        connectType =
            if (useTethered) ConnectIQ.IQConnectType.TETHERED
            else ConnectIQ.IQConnectType.WIRELESS

        val iq = ConnectIQ.getInstance(context, connectType)
        connectIQ = iq

        log("initialising SDK in ${connectType.name} mode")
        if (tethered) {
            log("waiting for the Connect IQ simulator to connect on port 7381")
        }

        // autoUI prompts the user to install or update Garmin Connect when it
        // is missing. That is right for WIRELESS and wrong for TETHERED, where
        // Garmin Connect is not involved at all and the prompt can only get in
        // the way.
        val autoUi = !tethered

        try {
            iq.initialize(context, autoUi, object : ConnectIQ.ConnectIQListener {
                override fun onSdkReady() {
                    main.post {
                        sdkReady = true
                        log("SDK ready")
                        emitSdk(true, "ready")
                        refreshDevice()
                        main.removeCallbacks(watchdog)
                        main.post(watchdog)
                    }
                }

                override fun onInitializeError(status: ConnectIQ.IQSdkErrorStatus?) {
                    main.post {
                        sdkReady = false
                        val detail = status?.name ?: "unknown"
                        log("SDK init failed: $detail")
                        emitSdk(false, detail)
                        // Every initialisation failure this SDK reports is
                        // about Garmin Connect: missing, too old, or its
                        // service refusing to bind. They all lead the user to
                        // the same place, so they get the same blocker and
                        // differ only in the detail string.
                        emitBlocked("no_garmin_connect", detail)
                    }
                }

                override fun onSdkShutDown() {
                    main.post {
                        sdkReady = false
                        log("SDK shut down")
                        emitSdk(false, "shut down")
                    }
                }
            })
        } catch (e: Exception) {
            main.post {
                reportFailure("initialize", e)
                emitBlocked("no_garmin_connect", e.javaClass.simpleName)
            }
        }
    }

    /**
     * Poll the device's connection state.
     *
     * Two reasons, and both are real. Over the tethered transport there is no
     * event at all when the simulator attaches to the socket:
     * `registerForDeviceEvents` fires once with NOT_CONNECTED and then stays
     * quiet. And on a real phone the device can drop out of range while the
     * capture screen is open, which is exactly when the user needs to be told.
     */
    private val watchdog = object : Runnable {
        override fun run() {
            val iq = connectIQ
            if (iq != null && sdkReady) {
                try {
                    val nowConnected = (iq.connectedDevices ?: emptyList()).isNotEmpty()
                    if (nowConnected != lastConnected) {
                        lastConnected = nowConnected
                        if (nowConnected) {
                            log("device attached")
                            refreshDevice()
                        } else {
                            log("device detached")
                            emitDevice(device?.friendlyName, false)
                            // Say why rather than leaving the phone to work it
                            // out from the silence. It keeps the last position
                            // on screen, marked stale, which is the honest
                            // picture: there IS a coordinate, it is just not
                            // being refreshed any more.
                            if (!tethered) {
                                emitBlocked("device_offline", "went out of range")
                            }
                        }
                    }
                } catch (ignored: Exception) {
                }
            }
            main.postDelayed(this, WATCHDOG_MS)
        }
    }

    fun stop() {
        started = false
        main.removeCallbacks(watchdog)
        lastConnected = false
        sdkReady = false
        val iq = connectIQ ?: return
        try {
            val d = device
            if (d != null && listeningForApp) {
                iq.unregisterForApplicationEvents(d, outboundApp())
            }
            if (d != null) {
                iq.unregisterForDeviceEvents(d)
            }
            iq.shutdown(context)
        } catch (e: Exception) {
            log("shutdown: ${e.javaClass.simpleName}")
        }
        listeningForApp = false
        listeningForDeviceId = null
        device = null
        connectIQ = null
    }

    // ---- devices ---------------------------------------------------------

    private fun refreshDevice() {
        val iq = connectIQ
        if (iq == null || !sdkReady) {
            log("not ready yet")
            return
        }

        try {
            val connected = iq.connectedDevices ?: emptyList()
            val known = iq.knownDevices ?: emptyList()
            log("connected=${connected.size} known=${known.size}")

            // Prefer a connected device. Fall back to a known one so the phone
            // can say "paired but not connected", which is a different problem
            // with a different fix.
            val chosen = connected.firstOrNull() ?: known.firstOrNull()
            if (chosen == null) {
                device = null
                emitDevice(null, false)
                emitBlocked("no_device", "nothing paired in Garmin Connect")
                return
            }

            device = chosen
            log("device: ${chosen.friendlyName} (${chosen.deviceIdentifier})")

            iq.registerForDeviceEvents(chosen) { dev, status ->
                main.post {
                    log("device status: ${status?.name}")
                    val isUp = status == IQDevice.IQDeviceStatus.CONNECTED
                    emitDevice(dev?.friendlyName ?: chosen.friendlyName, isUp)
                    if (isUp) {
                        lastConnected = true
                        listenForMessages()
                        checkApp()
                    }
                }
            }

            // Report what the transport says, not what the device object says.
            // IQDevice.status is stuck on UNKNOWN over ADB, so trusting it
            // makes a live link look dead.
            val isConnected = connected.isNotEmpty() ||
                chosen.status == IQDevice.IQDeviceStatus.CONNECTED ||
                (tethered && lastConnected)
            emitDevice(chosen.friendlyName, isConnected)

            if (!isConnected && !tethered) {
                // Paired but out of range or Bluetooth off. Keep the listeners
                // registered and keep the watchdog running: the user can walk
                // back into range without reopening the screen.
                emitBlocked("device_offline", chosen.status?.name ?: "not connected")
            }

            // Listen FIRST, and never gate it on device status or app info.
            //
            // Over the tethered transport the SDK reports the simulator as
            // UNKNOWN and never promotes it to CONNECTED, and
            // getApplicationInfo answers UNKNOWN too, because there is no real
            // device behind the socket to ask. Gating on either one leaves
            // nothing on the phone listening: the device's transmits are never
            // acknowledged and it retries into a socket nobody reads.
            //
            // Registering a listener for a device that turns out to be absent
            // costs nothing, so register and let the messages decide.
            listenForMessages()
            checkApp()
        } catch (e: Exception) {
            reportFailure("refreshDevice", e)
        }
    }

    // ---- the device app --------------------------------------------------

    private fun checkApp() {
        val iq = connectIQ ?: return
        val d = device ?: return

        io.execute {
            try {
                iq.getApplicationInfo(
                    WATCH_APP_ID, d,
                    object : ConnectIQ.IQApplicationInfoListener {
                        override fun onApplicationInfoReceived(app: IQApp?) {
                            main.post {
                                val version = app?.version() ?: -1
                                log("device app installed, version $version")
                                emitApp(true, "installed v$version")
                                listenForMessages()
                            }
                        }

                        override fun onApplicationNotInstalled(id: String?) {
                            main.post {
                                if (tethered) {
                                    // Over ADB this fires even when the app is
                                    // running fine in the simulator, because
                                    // there is no real device to ask.
                                    log("app info says NOT installed. Expected " +
                                        "over ADB; still listening for messages.")
                                    emitApp(null, "unknown (ADB)")
                                } else {
                                    log("device app not installed")
                                    emitApp(false, "not installed")
                                    emitBlocked("app_missing", "TreeMapper GPS not installed")
                                }
                                listenForMessages()
                            }
                        }
                    })
            } catch (e: Exception) {
                main.post { reportFailure("getApplicationInfo", e) }
            }
        }
    }

    /**
     * Register for messages coming back from the device.
     *
     * Exactly ONE listener, and which id it uses depends on the transport.
     *
     * Over the tethered (ADB) transport the Connect IQ simulator stamps its
     * outbound messages with an EMPTY application id rather than the id in
     * manifest.xml. The SDK routes inbound messages by that id, so a listener
     * registered for the real id never matches.
     *
     * Registering BOTH does not fix it and appears to make it worse: the SDK
     * keys its registration per device, so the second call replaces the first
     * rather than adding to it. An arriving message with no handler takes the
     * SDK's reader thread down with it, the socket closes, and the simulator
     * reports "Socket Error in packet header 0" and dies.
     *
     * So: empty id on TETHERED, real id on WIRELESS. One each, never both.
     *
     * forums.garmin.com/developer/connect-iq/f/discussion/379720
     */
    private fun listenForMessages() {
        val iq = connectIQ ?: return
        val d = device ?: return
        // Re-register when the device changes. The SDK keys a registration to
        // a device, so a listener left pointing at the one that walked away
        // hears nothing from the one that is here.
        if (listeningForApp && listeningForDeviceId == d.deviceIdentifier) return

        val target = outboundApp()
        val label = if (tethered) "empty id (simulator)" else WATCH_APP_ID

        try {
            iq.registerForAppEvents(d, target) { _, _, messageData, status ->
                main.post {
                    val payload = unwrap(messageData)
                    if (payload == null) {
                        log("<- unparsable message (status=${status?.name}): $messageData")
                    } else {
                        emitMessage(payload)
                    }
                }
            }
            listeningForApp = true
            listeningForDeviceId = d.deviceIdentifier
            log("listening for device messages on $label")
        } catch (e: Exception) {
            reportFailure("registerForAppEvents", e)
        }
    }

    /** Launch the device app remotely. This is what makes the modal flow work. */
    fun openWatchApp() {
        val iq = connectIQ ?: return
        val d = device ?: return

        if (tethered) {
            // openApplication asks Garmin Connect to launch an app on a real
            // device. Over ADB there is no device to launch on, and the SDK
            // answers InvalidStateException regardless of readiness. The app is
            // already running in the simulator, so there is nothing to do.
            log("openApplication does nothing over ADB; the app is already running")
            return
        }

        try {
            log("-> openApplication")
            iq.openApplication(d, watchApp) { _, _, status ->
                main.post { log("openApplication: ${status?.name}") }
            }
        } catch (e: Exception) {
            reportFailure("openApplication", e)
        }
    }

    fun openStore() {
        if (tethered) {
            log("openStore is not available over ADB, only on a real device")
            return
        }
        try {
            connectIQ?.openStore(WATCH_APP_ID)
        } catch (e: Exception) {
            reportFailure("openStore", e)
        }
    }

    // ---- messages --------------------------------------------------------

    /**
     * Post one command to the device.
     *
     * The payload goes out as a single-element List holding one Map, which is
     * how a Monkey C Dictionary arrives on the other side. See PROTOCOL.md.
     */
    fun send(payload: Map<String, Any>) {
        val iq = connectIQ
        val d = device
        val label = payload["c"]?.toString() ?: "?"

        if (iq == null || d == null) {
            log("cannot send $label: no device")
            return
        }
        if (!listeningForApp) {
            // Sending with nothing registered to hear the answer is worse than
            // not sending: the device transmits into a socket nobody reads and
            // the SDK's reader thread can take the link down with it.
            log("refusing to send $label: no app event listener registered yet")
            return
        }

        log("-> $label $payload")
        io.execute {
            try {
                iq.sendMessage(d, outboundApp(), listOf(payload)) { _, _, status ->
                    main.post { log("   send $label: ${status?.name}") }
                }
            } catch (e: Exception) {
                main.post { reportFailure("sendMessage($label)", e) }
            }
        }
    }

    // ---- errors ----------------------------------------------------------

    private fun reportFailure(what: String, e: Exception) {
        val hint = when (e) {
            is InvalidStateException ->
                if (tethered) "Not supported over ADB. The simulator is not a real device."
                else "SDK not ready. Wait for onSdkReady before calling anything."
            is ServiceUnavailableException ->
                "Garmin Connect Mobile is missing, signed out, or not running."
            else -> e.message ?: ""
        }
        log("$what failed: ${e.javaClass.simpleName}. $hint")

        // A ServiceUnavailableException is not a transient glitch: it means the
        // path to the device is gone and nothing will work until the user fixes
        // Garmin Connect. Say so rather than letting the screen wait forever.
        if (e is ServiceUnavailableException && !tethered) {
            emitBlocked("no_garmin_connect", "SERVICE_UNAVAILABLE")
        }
    }

    companion object {
        /** Must match `id` in the watch project's manifest.xml. */
        const val WATCH_APP_ID = "a7f3c81e6b2d4f9ea05c73819d4e6b21"

        private const val WATCHDOG_MS = 2000L

        /**
         * Pull the payload map out of whatever the SDK handed us.
         *
         * The SDK carries a `List<Object>`: a Monkey C Dictionary maps to a
         * Java Map and an Array to a List, so a message is one map inside a
         * single-element list. It has been seen delivered both bare and wrapped
         * depending on SDK version, so unwrap defensively.
         */
        @Suppress("UNCHECKED_CAST")
        fun unwrap(messageData: List<Any?>?): Map<String, Any?>? {
            if (messageData == null) return null
            for (item in messageData) {
                when (item) {
                    is Map<*, *> -> return item as Map<String, Any?>
                    is List<*> -> unwrap(item)?.let { return it }
                    else -> {}
                }
            }
            return null
        }

        /**
         * Carry the payload across to JavaScript without losing precision.
         *
         * Nothing is interpreted here; the parser is `src/garmin/protocol.ts`.
         * The one judgement call is Float: `toDouble()` on a Float widens its
         * binary error into the Double (812.4f becomes 812.4000244140625),
         * whereas going through its shortest decimal form gives back the value
         * that was meant. Coordinates arrive as Strings anyway, per
         * SAFE_COORDS in the watch's GpsService.mc, but altitude and speed come
         * through here as Floats and a stray 0.0000244 in a log is a red
         * herring nobody needs.
         */
        fun toBundle(map: Map<String, Any?>): Bundle {
            val bundle = Bundle()
            for ((rawKey, value) in map) {
                val key = rawKey.toString()
                when (value) {
                    null -> {}
                    is String -> bundle.putString(key, value)
                    is Boolean -> bundle.putBoolean(key, value)
                    is Int -> bundle.putInt(key, value)
                    is Short -> bundle.putInt(key, value.toInt())
                    is Byte -> bundle.putInt(key, value.toInt())
                    is Long -> bundle.putDouble(key, value.toDouble())
                    is Float -> bundle.putDouble(key, value.toString().toDouble())
                    is Double -> bundle.putDouble(key, value)
                    else -> bundle.putString(key, value.toString())
                }
            }
            return bundle
        }
    }
}
