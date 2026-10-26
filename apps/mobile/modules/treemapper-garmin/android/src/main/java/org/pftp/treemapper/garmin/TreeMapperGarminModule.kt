package org.pftp.treemapper.garmin

import android.content.pm.ApplicationInfo
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * The JavaScript face of the Connect IQ link.
 *
 * It is deliberately thin. Everything that knows about Garmin lives in
 * `GarminLink`, and everything that knows about the TreeMapper protocol lives
 * in `src/garmin/protocol.ts` on the JavaScript side. This class only owns the
 * lifetime of the link and the shape of the bridge.
 *
 * The contract it satisfies is written down in `src/garmin/transport.ts`:
 *
 *   start(tethered?)  -> initialize, discover, register listeners
 *   stop()
 *   send(command)
 *   openWatchApp()
 *   openStore()
 *
 * plus one event, `GarminLinkEvent`, carrying the union in that same file.
 */
class TreeMapperGarminModule : Module() {

    private var link: GarminLink? = null

    /**
     * One command for the device.
     *
     * A Record rather than a loose Map, and `ms` is an `Int?` rather than a
     * number, because the watch checks `ms instanceof Number` and Monkey C's
     * Number is a 32-bit integer. A JavaScript number crossing as a Double
     * would be silently ignored over there and the rate would never change.
     * Declaring the type here makes the bridge do the conversion once.
     */
    class Command : Record {
        @Field val c: String = ""

        @Field val ms: Int? = null
    }

    override fun definition() = ModuleDefinition {
        Name("TreeMapperGarmin")

        Events(EVENT_NAME)

        Function("start") { tethered: Boolean? ->
            // The ADB transport is a development tool: it speaks to the
            // Connect IQ simulator and bypasses Garmin Connect entirely. It
            // has no business in a shipped build, so a release build takes the
            // wireless path whatever it is asked for.
            val useTethered = tethered == true && isDebuggable()
            startLink(useTethered)
        }

        Function("stop") {
            link?.stop()
            link = null
        }

        Function("send") { command: Command ->
            val payload = mutableMapOf<String, Any>("c" to command.c)
            command.ms?.let { payload["ms"] = it }
            link?.send(payload)
        }

        Function("openWatchApp") {
            link?.openWatchApp()
        }

        Function("openStore") {
            link?.openStore()
        }

        // iOS has to send the user to Garmin Connect to pick which devices an
        // app may talk to, and keeps the answer. Android asks Garmin Connect
        // for that list directly, every time, so there is nothing to choose.
        // The function exists so the phone can call it without first asking
        // which platform it is on.
        Function("chooseDevice") {
            // Intentionally empty on Android.
        }

        // The capture screen is not the only way out of this module. A user
        // can background the app, or Android can tear the Activity down, and
        // an SDK left initialised holds a binding to Garmin Connect for
        // nothing.
        OnDestroy {
            link?.stop()
            link = null
        }
    }

    private fun startLink(useTethered: Boolean) {
        // Restarting is the normal case: the capture screen can be opened and
        // closed repeatedly in one session, and `retry` in the UI comes
        // straight back here.
        link?.stop()

        // The Activity, not the application context, when one is available.
        // `initialize(autoUI = true)` puts a dialog on screen when Garmin
        // Connect is missing or too old, and that needs somewhere to show it.
        val context = appContext.currentActivity
            ?: appContext.reactContext
            ?: throw IllegalStateException("No Android context available")

        link = GarminLink(context) { bundle -> sendEvent(EVENT_NAME, bundle) }
        link?.start(useTethered)
    }

    private fun isDebuggable(): Boolean {
        val info = appContext.reactContext?.applicationInfo ?: return false
        return (info.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    }

    companion object {
        private const val EVENT_NAME = "GarminLinkEvent"
    }
}
