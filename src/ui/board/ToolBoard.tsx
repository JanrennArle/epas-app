import { useEffect, useRef, useState } from 'react'
import type { ToolState } from '../../lib/board'
import { toolFor } from './tools'

// Module-level, not storage: the opening plays once per app launch. Coming
// back to the map from a lesson should not replay it.
let played = false

/**
 * The lamp-lit board. Decorative: the rack below it is the navigation, so the
 * board is aria-hidden and holds no focusable element.
 *
 * Opening moment: the lamp flickers on, the painted outlines draw in, then the
 * steel of every started or finished tool drops onto its hook with a spring.
 * Any pointer, key, wheel or touch finishes it at once. Reduced motion shows
 * the finished board.
 *
 * `nextId`, when its slot is still empty, gets a faint steel tool instead of
 * a bare outline: the payoff for finishing a module has to be visible on a
 * student's very first visit, when every real tool is still unearned.
 */
export function ToolBoard({ tools, nextId }: { tools: ToolState[]; nextId?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const skip = useRef(played || typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [phase, setPhase] = useState<'idle' | 'play' | 'done'>(skip.current ? 'done' : 'idle')

  // Runs once. It must not depend on `phase`: setting 'play' would re-run it,
  // and the re-run's cleanup would cancel the spring it just started.
  useEffect(() => {
    if (skip.current) return
    played = true
    const el = ref.current
    const slots = el ? [...el.querySelectorAll<HTMLElement>('.slot')] : []
    let raf = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      for (const s of slots) s.style.removeProperty('--ty')
      setPhase('done')
    }
    const start = requestAnimationFrame(() => setPhase('play'))

    // Critically damped spring, response 0.45s: tools land without bouncing.
    const response = 0.45
    const k = (2 * Math.PI / response) ** 2
    const c = (4 * Math.PI * 1) / response
    const state = slots.map(() => ({ y: -40, v: 0 }))
    const t0 = performance.now() + 900
    let last = 0
    const step = (t: number) => {
      const dt = Math.min(0.032, last ? (t - last) / 1000 : 1 / 60)
      last = t
      let moving = false
      slots.forEach((slot, i) => {
        const s = state[i]
        if (!s) return
        if (t < t0 + i * 70) { moving = true; slot.style.setProperty('--ty', `${s.y}px`); return }
        slot.classList.add('landed')
        s.v += (-k * s.y - c * s.v) * dt
        s.y += s.v * dt
        if (Math.abs(s.y) + Math.abs(s.v) > 0.05) moving = true
        slot.style.setProperty('--ty', `${s.y.toFixed(2)}px`)
      })
      if (moving) raf = requestAnimationFrame(step)
      else finish()
    }
    raf = requestAnimationFrame(step)

    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    for (const e of events) addEventListener(e, finish, { once: true, passive: true })
    return () => {
      cancelAnimationFrame(start)
      cancelAnimationFrame(raf)
      for (const e of events) removeEventListener(e, finish)
    }
  }, [])

  const opening = phase !== 'done'
  return (
    <div ref={ref} aria-hidden className={`board${opening ? ' board-opening' : ''}${phase === 'play' ? ' play' : ''}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6E7A73" />
            <stop offset="0.35" stopColor="#2B332F" />
            <stop offset="1" stopColor="#101412" />
          </linearGradient>
        </defs>
      </svg>
      <div className="lamp" />
      {tools.map((t, i) => {
        const Tool = toolFor(t.moduleId)
        const empty = t.done === 0
        const ghost = empty && t.moduleId === nextId
        return (
          <div key={t.moduleId} className={`slot${empty ? ' empty' : ''}${ghost ? ' ghost' : ''}`}
            style={{ ['--i' as string]: i, ['--fill' as string]: t.hung ? 1 : (ghost ? 1 : Math.max(0.12, t.fraction)) }}>
            <span className="hook" />
            <Tool weight="fill" className="outline" />
            <Tool weight="fill" className="shadow" color="rgba(0,0,0,0.55)" />
            <Tool weight="fill" className="tool" color="url(#steel)" />
            <span className="num">{t.moduleId.toUpperCase()}</span>
          </div>
        )
      })}
    </div>
  )
}
