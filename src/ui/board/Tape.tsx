import type { ReactNode } from 'react'

/**
 * Embossed label tape. It is the heading, not a decoration on one: the text
 * stays a real h1/h2/h3 so screen readers and tests see the heading, and the
 * tape wraps line by line on a long module title.
 */
export function Tape({ as: Tag = 'h1', size = 'page', id, children }: {
  as?: 'h1' | 'h2' | 'h3'
  size?: 'hero' | 'page' | 'section'
  id?: string
  children: ReactNode
}) {
  return (
    <Tag id={id} className={`tape-heading tape-heading--${size}`}>
      <span className="tape">{children}</span>
    </Tag>
  )
}
