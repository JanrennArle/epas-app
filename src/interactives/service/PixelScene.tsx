import { useId, useMemo } from 'react'
import { spriteFor } from './sprites'

interface Rect {
  x: number
  y: number
  w: number
  h: number
  fill: string
}

const put = (list: Rect[], x: number, y: number, w: number, h: number, fill: string) => {
  list.push({ x, y, w, h, fill })
}

const drawSprite = (list: Rect[], ox: number, oy: number, rows: string[], pal: Record<string, string>) => {
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const fill = pal[ch]
      if (fill) put(list, ox + x, oy + y, 1, 1, fill)
    })
  })
}

// The 3x5 sign glyphs from the approved reference. Only the letters REPAIR needs.
const GLYPH: Record<string, string[]> = {
  R: ['11.', '1.1', '11.', '1.1', '1.1'],
  E: ['111', '1..', '11.', '1..', '111'],
  P: ['11.', '1.1', '11.', '1..', '1..'],
  A: ['.1.', '1.1', '111', '1.1', '1.1'],
  I: ['111', '.1.', '.1.', '.1.', '111'],
}

const SIGN_TEXT = 'REPAIR'
const MOON: string[] = ['.ww.', 'ww..', 'w...', 'ww..', '.ww.']

interface PixelSceneProps {
  scenarioId: string
  appliance: string
}

/**
 * The Service Mode repair shop scene: a sixteen colour evening street with
 * the appliance under repair sitting healthy in the shop's lit window. The
 * picture is chosen from `scenarioId` alone, never from a fault, so it can
 * never hint at what is actually wrong with the appliance.
 */
export function PixelScene({ scenarioId, appliance }: PixelSceneProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const pid = (name: string) => `sv-${rawId}-${name}`

  const scene = useMemo(() => {
    // Seeded, so the city skyline is identical every time the scene mounts.
    let seed = 7
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

    const stars: Rect[] = []
    for (let i = 0; i < 38; i++) {
      put(stars, Math.floor(rnd() * 160), Math.floor(rnd() * 22), 1, 1, rnd() > 0.7 ? '#F1EFE6' : '#8B93A8')
    }
    drawSprite(stars, 84, 4, MOON, { w: '#F1EFE6' })

    const city: Rect[] = []
    for (let x = 0; x < 160; ) {
      const w = 7 + Math.floor(rnd() * 11)
      const top = 30 + Math.floor(rnd() * 24)
      if (x + w > 84 && x < 154) {
        x = x < 84 ? 84 : 154
        continue
      }
      put(city, x, top, w, 72 - top, '#10132E')
      for (let wy = top + 3; wy < 69; wy += 4) {
        for (let wx = x + 2; wx < x + w - 1; wx += 3) if (rnd() > 0.72) put(city, wx, wy, 1, 2, '#F2B138')
      }
      x += w + (rnd() > 0.6 ? 1 : 0)
    }

    const shop: Rect[] = []
    put(shop, 88, 38, 64, 34, '#10132E') // shell
    put(shop, 90, 38, 60, 34, '#232A63') // wall
    for (let x = 86; x < 154; x += 4) put(shop, x, 31, 4, 6, (x / 4) % 2 ? '#F1EFE6' : '#E8622C') // awning
    for (let x = 86; x < 154; x += 4) put(shop, x + 1, 37, 2, 1, (x / 4) % 2 ? '#F1EFE6' : '#E8622C')
    put(shop, 104, 19, 33, 11, '#0A0C1E') // sign board
    put(shop, 105, 20, 31, 9, '#10132E')
    put(shop, 110, 30, 1, 1, '#8B93A8')
    put(shop, 130, 30, 1, 1, '#8B93A8')
    ;[...SIGN_TEXT].forEach((c, i) => {
      const glyph = GLYPH[c]
      if (glyph) drawSprite(shop, 109 + i * 4, 22, glyph, { '1': '#5BD26B' })
    })
    put(shop, 94, 41, 38, 27, '#F1EFE6') // window frame
    put(shop, 95, 42, 36, 25, '#F2B138') // lit glass
    for (let y = 62; y < 67; y++) {
      for (let x = 95; x < 131; x++) if ((x + y) % 2) put(shop, x, y, 1, 1, '#E8622C')
    }

    // The appliance under repair, chosen by scenario id alone. Centred in the
    // left pane when it fits, or spanning both panes (mullion omitted) when
    // it does not.
    const appl = spriteFor(scenarioId)
    const width = appl.rows[0]?.length ?? 0
    const height = appl.rows.length
    const fitsLeftPane = width <= 16
    if (fitsLeftPane) put(shop, 112, 42, 1, 25, '#F1EFE6') // mullion
    const paneX = 95
    const paneWidth = fitsLeftPane ? 17 : 36
    const ox = paneX + Math.max(0, Math.floor((paneWidth - width) / 2))
    const oy = 42 + Math.max(0, Math.floor((25 - height) / 2))
    drawSprite(shop, ox, oy, appl.rows, appl.palette)

    put(shop, 135, 43, 12, 29, '#F1EFE6') // door
    put(shop, 136, 44, 10, 28, '#10132E')
    put(shop, 137, 46, 6, 8, '#1F6F74')
    put(shop, 144, 59, 1, 2, '#F2B138')

    return { stars, city, shop }
  }, [scenarioId])

  return (
    <svg
      className="scene"
      viewBox="0 0 160 90"
      preserveAspectRatio="xMaxYMid slice"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${appliance} on the repair bench`}
    >
      <defs>
        <pattern id={pid('night-dusk')} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#10132E" />
          <rect width="1" height="1" fill="#232A63" />
          <rect x="1" y="1" width="1" height="1" fill="#232A63" />
        </pattern>
        <pattern id={pid('dusk-teal')} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#232A63" />
          <rect width="1" height="1" fill="#1F6F74" />
          <rect x="1" y="1" width="1" height="1" fill="#1F6F74" />
        </pattern>
        <pattern id={pid('teal-sun')} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#1F6F74" />
          <rect width="1" height="1" fill="#E8622C" />
          <rect x="1" y="1" width="1" height="1" fill="#E8622C" />
        </pattern>
        <pattern id={pid('sun-amber')} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#E8622C" />
          <rect width="1" height="1" fill="#F2B138" />
          <rect x="1" y="1" width="1" height="1" fill="#F2B138" />
        </pattern>
        <pattern id={pid('street')} width="4" height="2" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill="#0A0C1E" />
          <rect width="1" height="1" fill="#10132E" />
          <rect x="2" y="1" width="1" height="1" fill="#10132E" />
        </pattern>
      </defs>
      <g>
        <rect width="160" height="24" fill="#10132E" />
        <rect y="22" width="160" height="3" fill={`url(#${pid('night-dusk')})`} />
        <rect y="25" width="160" height="14" fill="#232A63" />
        <rect y="38" width="160" height="3" fill={`url(#${pid('dusk-teal')})`} />
        <rect y="41" width="160" height="10" fill="#1F6F74" />
        <rect y="50" width="160" height="3" fill={`url(#${pid('teal-sun')})`} />
        <rect y="53" width="160" height="10" fill="#E8622C" />
        <rect y="62" width="160" height="3" fill={`url(#${pid('sun-amber')})`} />
        <rect y="65" width="160" height="8" fill="#F2B138" />
      </g>
      <g>
        {scene.stars.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </g>
      <g>
        {scene.city.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </g>
      <g>
        {scene.shop.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </g>
      <rect y="72" width="160" height="1" fill="#8B93A8" />
      <rect y="73" width="160" height="17" fill={`url(#${pid('street')})`} />
    </svg>
  )
}
