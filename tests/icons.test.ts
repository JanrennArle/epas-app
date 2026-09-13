import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

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

  // A maskable icon with transparent corners shows as a black-cornered tile
  // in an Android launcher, which is the whole reason the maskable variant
  // exists. Checking the corner pixel needs the decoded image, which this
  // test does not have, so it checks the next best thing: the two 512 icons
  // are drawn differently, which they would not be if the full-bleed flag
  // were dropped.
  it('draws the maskable icon differently from the plain one', () => {
    const plain = readFileSync('public/icon-512.png')
    const maskable = readFileSync('public/icon-maskable-512.png')
    expect(maskable.equals(plain)).toBe(false)
  })
})
