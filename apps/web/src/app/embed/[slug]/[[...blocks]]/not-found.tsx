/**
 * Shown inside a partner's iframe when the project's public page is off or
 * the widget URL is wrong. Small and neutral on purpose: it sits on someone
 * else's website, and must not hint at whether a private project exists.
 */
export default function EmbedNotFound() {
  return (
    <div
      style={{
        padding: '1.5rem',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.875rem',
        color: '#55645b',
        background: '#ffffff',
        textAlign: 'center',
      }}
    >
      This project is not available right now.
    </div>
  )
}
