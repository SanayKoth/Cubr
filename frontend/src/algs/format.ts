/*
  Display-only. The raw alg string stays intact for invert / diagrams.
  Grouping parens are training noise; 2' and 3 are the same face turn.
*/
export function displayAlg(moves: string): string {
  return moves
    .replace(/[()]/g, '')
    .replace(/2'/g, '2')
    .replace(/([URFDLBurfdlbMESxyz])3'/g, '$1')
    .replace(/([URFDLBurfdlbMESxyz])3\b/g, "$1'")
    .replace(/\s+/g, ' ')
    .trim()
}
