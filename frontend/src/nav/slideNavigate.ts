export type SlideDirection = 'left' | 'right'

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> }
}

const MOUNT_TIMEOUT_MS = 600

function waitFor(selector: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve()
      return
    }
    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return
      observer.disconnect()
      window.clearTimeout(timeout)
      resolve()
    })
    const timeout = window.setTimeout(() => {
      observer.disconnect()
      resolve()
    }, MOUNT_TIMEOUT_MS)
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

/*
  Slide between sibling routes with the View Transitions API. The update
  waits for the destination page root to mount, since the router may commit
  the route change in a transition rather than synchronously.
*/
export function slideNavigate(
  go: () => void,
  direction: SlideDirection,
  destinationSelector: string,
) {
  const doc = document as ViewTransitionDocument
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduced) {
    go()
    return
  }
  const root = document.documentElement
  root.dataset.pageSlide = direction
  const transition = doc.startViewTransition(() => {
    go()
    return waitFor(destinationSelector)
  })
  void transition.finished.finally(() => {
    delete root.dataset.pageSlide
  })
}

export const TIMER_PAGE = 'main[data-input-mode]'
export const ALGS_PAGE = '[data-algs-page]'
