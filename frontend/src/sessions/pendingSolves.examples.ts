import { bufferPreReadySolve, takePreReadySolves } from './pendingSolves.ts'

export function verifyPreReadyBuffer() {
  takePreReadySolves()
  bufferPreReadySolve({ timeMs: 1234, penalty: 'NONE', scramble: "R U R'" })
  bufferPreReadySolve({ timeMs: 2345, penalty: 'PLUS_TWO', scramble: 'U' })
  const first = takePreReadySolves()
  if (first.length !== 2 || first[0].timeMs !== 1234 || first[1].timeMs !== 2345) {
    throw new Error('pre-ready buffer lost or reordered solves')
  }
  if (takePreReadySolves().length !== 0) {
    throw new Error('pre-ready buffer was not drained')
  }
}

verifyPreReadyBuffer()
console.log('pre-ready buffer: all passed')
