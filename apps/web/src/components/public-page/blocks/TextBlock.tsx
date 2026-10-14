import { Kicker, Section } from '../primitives'
import type { BlockProps } from './types'

/**
 * Words the project wrote itself.
 *
 * The only block on a public page whose content is typed rather than measured,
 * which is why it is handled carefully in three ways. The text comes from
 * `spec.content`, so it travels with the arrangement and the server caps its
 * length. It is rendered as **text nodes only**: no markup, no links, nothing
 * that could turn a project description into an injection surface on a page
 * served to anyone with the URL. And an empty block renders nothing rather
 * than an empty frame, so a half-written note never reaches a visitor.
 *
 * `variant: 'quote'` sets it larger and centred, for a line that carries the
 * page rather than explaining it.
 */
export function TextBlock({ spec }: BlockProps) {
  const heading = spec.content?.heading?.trim() ?? ''
  const body = spec.content?.body?.trim() ?? ''
  if (!heading && !body) return null

  // A blank line starts a new paragraph. That is the whole formatting model,
  // and it is enough for the few sentences this block is meant to hold.
  const paragraphs = body.split(/\n{2,}/).filter((part) => part.trim().length > 0)
  const quote = spec.variant === 'quote'

  return (
    <Section>
      <div className={quote ? 'mx-auto max-w-[44ch] text-center' : 'max-w-[68ch]'}>
        {heading ? (
          quote ? (
            <p
              className="m-0 text-[1.5rem] leading-[1.35]"
              style={{
                fontFamily: 'var(--pp-font-display)',
                fontWeight: 'var(--pp-display-weight)' as never,
              }}
            >
              {heading}
            </p>
          ) : (
            <h2 className="m-0 mb-5">
              <Kicker>{heading}</Kicker>
            </h2>
          )
        ) : null}

        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={`mb-0 whitespace-pre-line ${index === 0 && !heading ? 'mt-0' : 'mt-4'} ${
              quote ? 'text-[0.9375rem]' : 'text-base leading-[1.65]'
            }`}
            style={{ color: 'var(--pp-muted)' }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </Section>
  )
}
