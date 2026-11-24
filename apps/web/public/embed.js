/*
 * TreeMapper widget helper. Sizes every TreeMapper widget iframe on the page
 * to fit its content, so it shows no scrollbar and no empty space.
 *
 * Optional: without it a widget still works, at the height set on the iframe.
 * Plain ES5 with no dependencies, so it runs on any site. Safe to include more
 * than once. Message names must match src/components/public-page/embed.ts.
 */
(function () {
  if (window.__treemapperEmbed) return
  window.__treemapperEmbed = true

  var HEIGHT = 'treemapper:embed-height'
  var PING = 'treemapper:embed-ping'
  var SELECTOR = 'iframe[data-treemapper-embed]'

  function originOf(frame) {
    try {
      return new URL(frame.src, window.location.href).origin
    } catch (e) {
      return null
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.type !== HEIGHT) return
    var height = Math.ceil(Number(data.height))
    if (!(height > 0 && height < 20000)) return

    var frames = document.querySelectorAll(SELECTOR)
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i]
      // Only the frame that sent the message, and only if it really is the
      // origin its src points at.
      if (frame.contentWindow !== event.source) continue
      if (originOf(frame) !== event.origin) continue
      frame.style.height = height + 'px'
    }
  })

  // A widget may have loaded, and posted its height, before this script ran.
  function ping(frame) {
    var origin = originOf(frame)
    if (!origin || !frame.contentWindow) return
    frame.contentWindow.postMessage({ type: PING }, origin)
  }

  function pingAll() {
    var frames = document.querySelectorAll(SELECTOR)
    for (var i = 0; i < frames.length; i++) {
      ping(frames[i])
      frames[i].addEventListener('load', function (event) {
        ping(event.target)
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pingAll)
  } else {
    pingAll()
  }
})()
