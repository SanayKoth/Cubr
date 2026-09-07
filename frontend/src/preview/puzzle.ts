import type { PuzzleID } from 'cubing/twisty'

export function puzzleIdForEvent(event: string): PuzzleID {
  switch (event) {
    case '333':
    case '333oh':
    case '333bf':
    case '333fm':
      return '3x3x3'
    case '222':
      return '2x2x2'
    case '444':
      return '4x4x4'
    case '555':
      return '5x5x5'
    case '666':
      return '6x6x6'
    case '777':
      return '7x7x7'
    case 'minx':
      return 'megaminx'
    case 'pyram':
      return 'pyraminx'
    case 'skewb':
      return 'skewb'
    case 'sq1':
      return 'square1'
    case 'clock':
      return 'clock'
    default:
      return '3x3x3'
  }
}
