/*
  cubing.js inverts a half turn as 2' (same face). Cubers write 2.
  Amount 3 is a quarter the other way.
*/
export function canonicalMoves(moves: string): string {
  return moves
    .replace(/2'/g, '2')
    .replace(/([URFDLBurfdlbMESxyz])3'/g, '$1')
    .replace(/([URFDLBurfdlbMESxyz])3\b/g, "$1'")
    .replace(/\s+/g, ' ')
    .trim()
}
