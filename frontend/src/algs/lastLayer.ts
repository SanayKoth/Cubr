import { Alg } from 'cubing/alg'
import { cube3x3x3 } from 'cubing/puzzles'
import type { KPattern } from 'cubing/kpuzzle'
import { invertAlg } from './invert'

export type StickerTone = 'u' | 'd' | 'f' | 'r' | 'b' | 'l' | 'hidden'

export type LastLayerPaint = {
  u: StickerTone[][]
  f: StickerTone[]
  r: StickerTone[]
  b: StickerTone[]
  l: StickerTone[]
}

const CORNER_FACELETS: StickerTone[][] = [
  ['u', 'r', 'f'],
  ['u', 'b', 'r'],
  ['u', 'l', 'b'],
  ['u', 'f', 'l'],
  ['d', 'f', 'r'],
  ['d', 'l', 'f'],
  ['d', 'b', 'l'],
  ['d', 'r', 'b'],
]

const EDGE_FACELETS: StickerTone[][] = [
  ['u', 'f'],
  ['u', 'r'],
  ['u', 'b'],
  ['u', 'l'],
  ['d', 'f'],
  ['d', 'r'],
  ['d', 'b'],
  ['d', 'l'],
  ['f', 'r'],
  ['f', 'l'],
  ['b', 'r'],
  ['b', 'l'],
]

const kpuzzlePromise = cube3x3x3.kpuzzle()

function cornerSticker(pattern: KPattern, loc: number, slot: number): StickerTone {
  const piece = pattern.patternData.CORNERS.pieces[loc] ?? 0
  const ori = pattern.patternData.CORNERS.orientation[loc] ?? 0
  return CORNER_FACELETS[piece]?.[(slot - ori + 3) % 3] ?? 'hidden'
}

function edgeSticker(pattern: KPattern, loc: number, slot: number): StickerTone {
  const piece = pattern.patternData.EDGES.pieces[loc] ?? 0
  const ori = pattern.patternData.EDGES.orientation[loc] ?? 0
  return EDGE_FACELETS[piece]?.[(slot - ori + 2) % 2] ?? 'hidden'
}

function forMode(tone: StickerTone, mode: 'oll' | 'pll'): StickerTone {
  if (mode === 'oll') return tone === 'u' ? 'u' : 'hidden'
  return tone
}

export async function paintLastLayer(
  alg: string,
  mode: 'oll' | 'pll',
): Promise<LastLayerPaint> {
  const kpuzzle = await kpuzzlePromise
  let pattern = kpuzzle.defaultPattern()
  const setup = invertAlg(alg)
  if (setup) {
    try {
      pattern = pattern.applyAlg(new Alg(setup))
    } catch {
      // keep solved — the card still has the alg text
    }
  }
  const tone = (value: StickerTone) => forMode(value, mode)
  return {
    u: [
      [tone(cornerSticker(pattern, 2, 0)), tone(edgeSticker(pattern, 2, 0)), tone(cornerSticker(pattern, 1, 0))],
      [tone(edgeSticker(pattern, 3, 0)), 'u', tone(edgeSticker(pattern, 1, 0))],
      [tone(cornerSticker(pattern, 3, 0)), tone(edgeSticker(pattern, 0, 0)), tone(cornerSticker(pattern, 0, 0))],
    ],
    f: [
      tone(cornerSticker(pattern, 3, 1)),
      tone(edgeSticker(pattern, 0, 1)),
      tone(cornerSticker(pattern, 0, 2)),
    ],
    r: [
      tone(cornerSticker(pattern, 1, 2)),
      tone(edgeSticker(pattern, 1, 1)),
      tone(cornerSticker(pattern, 0, 1)),
    ],
    b: [
      tone(cornerSticker(pattern, 2, 2)),
      tone(edgeSticker(pattern, 2, 1)),
      tone(cornerSticker(pattern, 1, 1)),
    ],
    l: [
      tone(cornerSticker(pattern, 2, 1)),
      tone(edgeSticker(pattern, 3, 1)),
      tone(cornerSticker(pattern, 3, 2)),
    ],
  }
}
