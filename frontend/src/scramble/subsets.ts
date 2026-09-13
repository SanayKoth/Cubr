import { KPattern, type KPatternData, type KPuzzle } from 'cubing/kpuzzle'
import { cube3x3x3 } from 'cubing/puzzles'
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search'
import type { ScrambleType } from './types'

/*
  cube3x3x3 kpuzzle orbit order (cubing.js, same as toReid333Struct).
  Do not assume Reid order from memory — these are the definition indices.

  EDGES (12):  0 UF, 1 UR, 2 UB, 3 UL, 4 DF, 5 DR, 6 DB, 7 DL, 8 FR, 9 FL, 10 BR, 11 BL
  CORNERS (8): 0 UFR, 1 URB, 2 UBL, 3 ULF, 4 DRF, 5 DFL, 6 DLB, 7 DBR
  CENTERS:     U L F R B D

  D is the cross color / bottom. U is last layer.
  E-slice = FR FL BR BL.
*/

const UF = 0
const UR = 1
const UB = 2
const UL = 3
const DF = 4
const DR = 5
const DB = 6
const DL = 7
const FR = 8
const FL = 9
const BR = 10
const BL = 11

const UFR = 0
const URB = 1
const UBL = 2
const ULF = 3
const DRF = 4
const DFL = 5
const DLB = 6
const DBR = 7

const U_EDGES = [UF, UR, UB, UL]
const D_EDGES = [DF, DR, DB, DL]
const E_EDGES = [FR, FL, BR, BL]
const F2L_EDGES = [...D_EDGES, ...E_EDGES]
const U_CORNERS = [UFR, URB, UBL, ULF]
const D_CORNERS = [DRF, DFL, DLB, DBR]
const ROUX_SB_EDGES = [FL, BL, DL, FR, BR, DR]
const ROUX_SB_CORNERS = [DFL, DLB, DRF, DBR]

type Mask = {
  solvedEdges: readonly number[]
  solvedCorners: readonly number[]
  orientedEdges?: readonly number[]
  orientedCorners?: readonly number[]
}

type MaskId = 'cross' | 'f2l' | 'll' | 'pll' | 'zbll' | 'cmll' | 'l6e'

const MASKS: Record<MaskId, Mask> = {
  cross: { solvedEdges: D_EDGES, solvedCorners: [] },
  f2l: { solvedEdges: F2L_EDGES, solvedCorners: D_CORNERS },
  ll: { solvedEdges: F2L_EDGES, solvedCorners: D_CORNERS },
  pll: {
    solvedEdges: F2L_EDGES,
    solvedCorners: D_CORNERS,
    orientedEdges: U_EDGES,
    orientedCorners: U_CORNERS,
  },
  zbll: {
    solvedEdges: F2L_EDGES,
    solvedCorners: D_CORNERS,
    orientedEdges: U_EDGES,
  },
  cmll: { solvedEdges: ROUX_SB_EDGES, solvedCorners: ROUX_SB_CORNERS },
  l6e: {
    solvedEdges: ROUX_SB_EDGES,
    solvedCorners: [...ROUX_SB_CORNERS, ...U_CORNERS],
  },
}

const MASK_BY_TYPE: Record<Exclude<ScrambleType, 'WCA'>, MaskId> = {
  Cross: 'cross',
  F2L: 'f2l',
  OLL: 'll',
  PLL: 'pll',
  ZBLL: 'zbll',
  CMLL: 'cmll',
  L6E: 'l6e',
}

let kpuzzlePromise: Promise<KPuzzle> | null = null

function getKpuzzle(): Promise<KPuzzle> {
  kpuzzlePromise ??= cube3x3x3.kpuzzle()
  return kpuzzlePromise
}

function shuffle(values: number[]): void {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = values[i]
    values[i] = values[j]!
    values[j] = swap!
  }
}

function permutationParity(pieces: number[]): number {
  const seen = Array.from({ length: pieces.length }, () => false)
  let inversions = 0
  for (let start = 0; start < pieces.length; start++) {
    if (seen[start]) continue
    let length = 0
    let index = start
    while (!seen[index]) {
      seen[index] = true
      index = pieces[index]!
      length++
    }
    if (length > 0) inversions += length - 1
  }
  return inversions % 2
}

function randomizeOrientation(orientation: number[], locations: number[], mod: number): void {
  if (locations.length === 0) return
  let sum = 0
  for (let i = 0; i < locations.length - 1; i++) {
    const value = Math.floor(Math.random() * mod)
    orientation[locations[i]!] = value
    sum += value
  }
  orientation[locations[locations.length - 1]!] = (mod - (sum % mod)) % mod
}

function randomizeOrbit(
  pieces: number[],
  orientation: number[],
  solved: ReadonlySet<number>,
  oriented: ReadonlySet<number>,
  oriMod: number,
): number[] {
  const movable: number[] = []
  for (let i = 0; i < pieces.length; i++) {
    if (!solved.has(i)) movable.push(i)
  }
  const ids = movable.map((location) => pieces[location]!)
  shuffle(ids)
  movable.forEach((location, index) => {
    pieces[location] = ids[index]!
  })

  const freeOri: number[] = []
  for (let i = 0; i < orientation.length; i++) {
    if (solved.has(i) || oriented.has(i)) {
      orientation[i] = 0
    } else {
      freeOri.push(i)
    }
  }
  randomizeOrientation(orientation, freeOri, oriMod)
  return movable
}

function applyMask(kpuzzle: KPuzzle, mask: Mask): KPattern {
  const solved = kpuzzle.defaultPattern()
  const edges = solved.patternData.EDGES
  const corners = solved.patternData.CORNERS
  if (!edges || !corners) {
    throw new Error('cube3x3x3 kpuzzle is missing EDGES/CORNERS orbits')
  }

  const edgePieces = [...edges.pieces]
  const edgeOri = [...edges.orientation]
  const cornerPieces = [...corners.pieces]
  const cornerOri = [...corners.orientation]

  const solvedEdges = new Set(mask.solvedEdges)
  const solvedCorners = new Set(mask.solvedCorners)
  const orientedEdges = new Set(mask.orientedEdges ?? [])
  const orientedCorners = new Set(mask.orientedCorners ?? [])

  const movableEdges = randomizeOrbit(edgePieces, edgeOri, solvedEdges, orientedEdges, 2)
  const movableCorners = randomizeOrbit(
    cornerPieces,
    cornerOri,
    solvedCorners,
    orientedCorners,
    3,
  )

  if (permutationParity(edgePieces) !== permutationParity(cornerPieces)) {
    if (movableEdges.length >= 2) {
      const a = movableEdges[0]!
      const b = movableEdges[1]!
      const swap = edgePieces[a]!
      edgePieces[a] = edgePieces[b]!
      edgePieces[b] = swap
    } else if (movableCorners.length >= 2) {
      const a = movableCorners[0]!
      const b = movableCorners[1]!
      const swap = cornerPieces[a]!
      cornerPieces[a] = cornerPieces[b]!
      cornerPieces[b] = swap
    }
  }

  const patternData: KPatternData = {}
  for (const [name, orbit] of Object.entries(solved.patternData)) {
    if (name === 'EDGES') {
      patternData[name] = { pieces: edgePieces, orientation: edgeOri }
    } else if (name === 'CORNERS') {
      patternData[name] = { pieces: cornerPieces, orientation: cornerOri }
    } else {
      patternData[name] = {
        pieces: [...orbit.pieces],
        orientation: [...orbit.orientation],
      }
    }
  }
  return new KPattern(kpuzzle, patternData)
}

export async function generateSubsetScramble(type: Exclude<ScrambleType, 'WCA'>): Promise<string> {
  const kpuzzle = await getKpuzzle()
  const mask = MASKS[MASK_BY_TYPE[type]]
  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const pattern = applyMask(kpuzzle, mask)
      const solution = await experimentalSolve3x3x3IgnoringCenters(pattern)
      return solution.invert().toString()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`failed to generate ${type} scramble`)
}
