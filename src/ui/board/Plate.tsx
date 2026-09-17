import { Link } from 'react-router'
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'quiet'

/**
 * A painted steel plate. `primary` is the yellow one, and a screen has at most
 * one: it is the action the student came for. Everything else is `quiet`.
 */
export function PlateLink({ variant = 'quiet', children, className, ...rest }:
  { variant?: Variant; children: ReactNode } & ComponentProps<typeof Link>) {
  return (
    <Link {...rest} className={`plate plate--${variant}${className ? ` ${className}` : ''}`}>
      {children}
    </Link>
  )
}

export function PlateButton({ variant = 'quiet', children, className, type = 'button', ...rest }:
  { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} className={`plate plate--${variant}${className ? ` ${className}` : ''}`}>
      {children}
    </button>
  )
}
