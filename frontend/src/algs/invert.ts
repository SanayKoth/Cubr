import { Alg } from 'cubing/alg'

export function invertAlg(moves: string): string {
  try {
    return new Alg(moves).invert().expand().toString()
  } catch {
    return ''
  }
}
