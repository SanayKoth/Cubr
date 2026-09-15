import type { TwistyPlayer } from 'cubing/twisty'

/*
  cubing.js defers WebGL until the player has a non-zero box.
  Shared by the timer scramble preview so we do not copy
  Symbol(intersectedCallback) walking in two places.
*/
function startVisualization(player: TwistyPlayer) {
  let proto: object | null = Object.getPrototypeOf(player)
  while (proto && proto !== Object.prototype) {
    const symbol = Object.getOwnPropertySymbols(proto).find(
      (key) => String(key) === 'Symbol(intersectedCallback)',
    )
    if (symbol) {
      const start = Reflect.get(proto, symbol)
      if (typeof start === 'function') {
        start.call(player)
        return
      }
    }
    proto = Object.getPrototypeOf(proto)
  }
}

export function startWhenSized(player: TwistyPlayer): () => void {
  const tryStart = () => {
    if (player.clientHeight > 0) {
      startVisualization(player)
      return true
    }
    return false
  }

  if (tryStart()) return () => {}

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting && entry.intersectionRect.height > 0)) {
      startVisualization(player)
      observer.disconnect()
    }
  })
  observer.observe(player)
  requestAnimationFrame(() => {
    if (tryStart()) observer.disconnect()
  })
  return () => observer.disconnect()
}
