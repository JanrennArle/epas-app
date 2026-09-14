import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

/**
 * An icon is the one asset nothing else in the app renders, so a truncated
 * or wrongly sized one is invisible until a student tries to install the app
 * and the browser silently declines. Chrome needs 192 and 512 to offer
 * installation at all.
 */
const EXPECTED = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/icon-maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
] as const

type Pixel = { r: number; g: number; b: number; a: number }

/**
 * Decodes a PNG written by scripts/make-icons.mjs, not a general PNG. That
 * generator writes exactly one IDAT chunk and filter byte 0 on every
 * scanline (store the bytes as they are), so decoding is: concatenate the
 * IDAT payload, inflate it, and read each row as one leading filter byte
 * followed by width*4 RGBA bytes. A PNG from anywhere else (adaptive
 * filtering, interlacing, multiple IDAT chunks split mid-row) is not
 * guaranteed to decode correctly with this helper.
 */
function pngPixels(path: string) {
  const buf = readFileSync(path)
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)

  const idatParts: Buffer[] = []
  let offset = 8
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset)
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii')
    if (type === 'IDAT') idatParts.push(buf.subarray(offset + 8, offset + 8 + len))
    offset += 12 + len // length (4) + type (4) + data (len) + crc (4)
    if (type === 'IEND') break
  }
  const raw = inflateSync(Buffer.concat(idatParts))
  const stride = 1 + width * 4 // one filter byte, then RGBA

  return {
    at(x: number, y: number): Pixel {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        throw new Error(`pixel (${x},${y}) is outside the ${width}x${height} image`)
      }
      const i = y * stride + 1 + x * 4
      const r = raw[i]
      const g = raw[i + 1]
      const b = raw[i + 2]
      const a = raw[i + 3]
      if (r === undefined || g === undefined || b === undefined || a === undefined) {
        throw new Error(`pixel (${x},${y}) read past the decoded buffer`)
      }
      return { r, g, b, a }
    },
  }
}

const TEAL = { r: 14, g: 110, b: 99 }

describe('the app icons', () => {
  for (const [path, size] of EXPECTED) {
    it(`${path} is a ${size}px PNG`, () => {
      const b = readFileSync(path)
      expect(b.subarray(0, 8).toString('hex'), 'PNG signature').toBe('89504e470d0a1a0a')
      expect(b.subarray(12, 16).toString('ascii'), 'first chunk').toBe('IHDR')
      expect(b.readUInt32BE(16), 'width').toBe(size)
      expect(b.readUInt32BE(20), 'height').toBe(size)
      expect(b[24], 'bit depth').toBe(8)
      expect(b[25], 'colour type, 6 is RGBA').toBe(6)
      expect(b.length, 'a plausible file rather than a stub').toBeGreaterThan(200)
    })
  }

  // The header checks above pass for a blank tile, a solid fill, or the
  // wrong colour, since none of them touch what was actually drawn. Nobody
  // sees this icon again until a student tries to install the app, so a
  // silently blank one would ship undetected. Decoding the pixels is the
  // only way to tell a drawn glyph from an empty buffer.
  it('draws a white glyph on teal, not a blank tile', () => {
    const px = pngPixels('public/icon-512.png')

    // The centre of the E (its middle arm) crosses the middle of the icon.
    const centre = px.at(256, 256)
    expect(centre, 'centre should be the white glyph, not empty').toEqual({ r: 255, g: 255, b: 255, a: 255 })

    // Away from the glyph, inside the rounded square, is the flat teal fill.
    const field = px.at(256, 100)
    expect(field, 'field should be the teal fill').toEqual({ ...TEAL, a: 255 })
  })

  // A maskable icon with a transparent corner shows as a black-cornered tile
  // in an Android launcher, which is the entire reason the maskable variant
  // exists. This is the real guard: the corner pixel must be opaque.
  it('the maskable icon has no transparent corner', () => {
    const px = pngPixels('public/icon-maskable-512.png')
    const corner = px.at(0, 0)
    expect(corner.a, 'maskable corner alpha').toBe(255)
    expect({ r: corner.r, g: corner.g, b: corner.b }, 'maskable corner colour').toEqual(TEAL)
  })

  // The corner check above passes for a solid teal square with no glyph at
  // all, the same blank-tile failure the plain icon's glyph test exists to
  // catch, one file over. The maskable variant's safe-zone inset (0.34) still
  // centres its middle arm on the icon's own centre, same as the plain icon.
  it('the maskable icon draws a white glyph on teal, not a blank tile', () => {
    const px = pngPixels('public/icon-maskable-512.png')

    const centre = px.at(256, 256)
    expect(centre, 'centre should be the white glyph, not empty').toEqual({ r: 255, g: 255, b: 255, a: 255 })

    const field = px.at(256, 100)
    expect(field, 'field should be the teal fill').toEqual({ ...TEAL, a: 255 })
  })

  // apple-touch-icon.png is what an iPhone puts on a home screen, and it is
  // never decoded elsewhere in this suite, only header-and-size checked
  // above. Same blank-tile failure, same fix: decode the pixels.
  it('the apple touch icon draws a white glyph on teal, not a blank tile', () => {
    const px = pngPixels('public/apple-touch-icon.png')

    const centre = px.at(90, 90)
    expect(centre, 'centre should be the white glyph, not empty').toEqual({ r: 255, g: 255, b: 255, a: 255 })

    const field = px.at(90, 20)
    expect(field, 'field should be the teal fill').toEqual({ ...TEAL, a: 255 })
  })

  // The plain icon draws its own rounded corners, so its corner pixel is the
  // opposite: transparent. This is what distinguishes it from the maskable
  // variant above, and confirms the two are not accidentally the same
  // full-bleed drawing.
  it('the plain icon has a transparent corner', () => {
    const px = pngPixels('public/icon-192.png')
    const corner = px.at(0, 0)
    expect(corner.a, 'plain icon corner alpha').toBe(0)
  })
})
