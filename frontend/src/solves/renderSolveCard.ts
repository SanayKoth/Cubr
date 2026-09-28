import type { SolveCardModel } from './cardModel'

const CSS_WIDTH = 352
const PAD = 24
const RADIUS = 32
const CUBE = 208

function token(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return raw || fallback
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('png'))
    }, 'image/png')
  })
}

/*
  Opaque 2D card — glass and WebGL cannot be snapshotted reliably.
  Colors come from the same tokens as the live face.
*/
export async function renderSolveCardPng(
  model: SolveCardModel,
  cube: HTMLCanvasElement | null,
): Promise<Blob> {
  await document.fonts.ready

  const elevated = token('--color-elevated', '#1b1b1f')
  const text = token('--color-text', '#ededf0')
  const dim = token('--color-text-dim', '#9a9aa5')
  const muted = token('--color-text-muted', '#6a6a75')
  const accent = token('--color-accent', '#8fa86b')
  const sans = token('--font-sans', 'Inter Variable, system-ui, sans-serif')
  const brand = token('--font-brand', 'Courier Prime, ui-monospace, monospace')

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('canvas')
  measure.font = `14px ${sans}`
  const scrambleLines = model.scramble
    ? wrapLines(measure, model.scramble, CSS_WIDTH - PAD * 2)
    : []

  let cssHeight = PAD + 18
  if (model.scramble) cssHeight += 12 + CUBE
  cssHeight += 12 + 48 + 8 + 20
  cssHeight += 24 + 1 + 20 + 36
  if (scrambleLines.length) cssHeight += 24 + scrambleLines.length * 20
  if (model.when) cssHeight += 20 + 16
  cssHeight += 20

  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(CSS_WIDTH * dpr)
  canvas.height = Math.round(cssHeight * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.scale(dpr, dpr)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = elevated
  roundRect(ctx, 0, 0, CSS_WIDTH, cssHeight, RADIUS)
  ctx.fill()

  ctx.fillStyle = 'rgba(237, 237, 240, 0.12)'
  ctx.fillRect(24, 0.5, CSS_WIDTH - 48, 1)

  let y = PAD + 14
  ctx.font = `14px ${brand}`
  ctx.fillStyle = muted
  ctx.textAlign = 'left'
  ctx.fillText('Cubr', PAD, y)
  const brandWidth = ctx.measureText('Cubr').width
  ctx.font = `12px ${sans}`
  ctx.fillText(model.kind, PAD + brandWidth + 8, y)
  ctx.textAlign = 'right'
  ctx.fillText(`#${model.number}`, CSS_WIDTH - PAD, y)

  if (model.scramble) {
    const cubeX = (CSS_WIDTH - CUBE) / 2
    const cubeY = y + 16
    if (cube && cube.width > 0) {
      ctx.drawImage(cube, cubeX, cubeY, CUBE, CUBE)
    }
    y = cubeY + CUBE
  }

  y += 44
  ctx.textAlign = 'center'
  ctx.font = `48px ${sans}`
  ctx.fillStyle = model.pbThen ? accent : text
  ctx.fillText(model.timeLabel, CSS_WIDTH / 2, y)

  y += 24
  ctx.font = `14px ${sans}`
  ctx.fillStyle = muted
  const session = model.sessionName
  const sessionWidth = CSS_WIDTH - PAD * 2
  if (ctx.measureText(session).width > sessionWidth) {
    let clipped = session
    while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > sessionWidth) {
      clipped = clipped.slice(0, -1)
    }
    ctx.fillText(`${clipped}…`, CSS_WIDTH / 2, y)
  } else {
    ctx.fillText(session, CSS_WIDTH / 2, y)
  }

  y += 28
  ctx.fillStyle = 'rgba(237, 237, 240, 0.08)'
  ctx.fillRect(48, y, CSS_WIDTH - 96, 1)

  y += 36
  ctx.font = `12px ${sans}`
  ctx.fillStyle = muted
  ctx.fillText('ao5', CSS_WIDTH / 2 - 56, y)
  ctx.fillText('ao12', CSS_WIDTH / 2 + 56, y)
  y += 22
  ctx.font = `18px ${sans}`
  ctx.fillStyle = text
  ctx.fillText(model.ao5, CSS_WIDTH / 2 - 56, y)
  ctx.fillText(model.ao12, CSS_WIDTH / 2 + 56, y)

  if (scrambleLines.length) {
    y += 32
    ctx.font = `14px ${sans}`
    ctx.fillStyle = dim
    for (const line of scrambleLines) {
      ctx.fillText(line, CSS_WIDTH / 2, y)
      y += 20
    }
  }

  if (model.when) {
    y += 24
    ctx.font = `12px ${sans}`
    ctx.fillStyle = muted
    ctx.fillText(model.when, CSS_WIDTH / 2, y)
  }

  return canvasToBlob(canvas)
}
