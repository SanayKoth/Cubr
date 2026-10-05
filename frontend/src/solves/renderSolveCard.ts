import type { SolveCardModel } from './cardModel'

const CSS_WIDTH = 320
const PAD = 20
const RADIUS = 28
const CUBE = 192

function token(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return raw || fallback
}

function rgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim()
  if (raw.length !== 6) return `rgba(143, 168, 107, ${alpha})`
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

  const bg = token('--color-bg', '#0d0d0f')
  const text = token('--color-text', '#ededf0')
  const dim = token('--color-text-dim', '#9a9aa5')
  const muted = token('--color-text-muted', '#6a6a75')
  const accent = token('--color-accent', '#8fa86b')
  const sans = token('--font-sans', 'Inter Variable, system-ui, sans-serif')
  const brand = token('--font-brand', 'Courier Prime, ui-monospace, monospace')

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('canvas')
  measure.font = `13px ${sans}`
  const scrambleLines = model.scramble
    ? wrapLines(measure, model.scramble, CSS_WIDTH - PAD * 2)
    : []

  let cssHeight = PAD + 16
  if (model.scramble) cssHeight += 4 + CUBE
  cssHeight += 4 + 48 + 4 + 18
  cssHeight += 16 + 1 + 14 + 32
  if (scrambleLines.length) cssHeight += 16 + scrambleLines.length * 18
  if (model.when) cssHeight += 14 + 14
  cssHeight += 16

  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(CSS_WIDTH * dpr)
  canvas.height = Math.round(cssHeight * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.scale(dpr, dpr)
  ctx.textBaseline = 'alphabetic'

  roundRect(ctx, 0, 0, CSS_WIDTH, cssHeight, RADIUS)
  ctx.clip()

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CSS_WIDTH, cssHeight)

  const glowY = model.scramble ? PAD + 16 + CUBE / 2 : cssHeight * 0.32
  const glow = ctx.createRadialGradient(
    CSS_WIDTH / 2,
    glowY,
    12,
    CSS_WIDTH / 2,
    glowY,
    170,
  )
  glow.addColorStop(0, rgba(accent, 0.22))
  glow.addColorStop(0.55, rgba(accent, 0.06))
  glow.addColorStop(1, rgba(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CSS_WIDTH, cssHeight)

  ctx.strokeStyle = rgba(accent, 0.24)
  ctx.lineWidth = 1
  roundRect(ctx, 0.5, 0.5, CSS_WIDTH - 1, cssHeight - 1, RADIUS)
  ctx.stroke()

  ctx.fillStyle = rgba(accent, 0.2)
  ctx.fillRect(20, 0.5, CSS_WIDTH - 40, 1)

  let y = PAD + 12
  ctx.font = `14px ${brand}`
  ctx.fillStyle = accent
  ctx.textAlign = 'left'
  ctx.fillText('Cubr', PAD, y)
  const brandWidth = ctx.measureText('Cubr').width
  ctx.font = `12px ${sans}`
  ctx.fillStyle = muted
  ctx.fillText(model.kind, PAD + brandWidth + 8, y)
  ctx.textAlign = 'right'
  ctx.fillText(`#${model.number}`, CSS_WIDTH - PAD, y)

  if (model.scramble) {
    const cubeX = (CSS_WIDTH - CUBE) / 2
    const cubeY = y + 8
    if (cube && cube.width > 0) {
      ctx.drawImage(cube, cubeX, cubeY, CUBE, CUBE)
    }
    y = cubeY + CUBE
  }

  y += 40
  ctx.textAlign = 'center'
  ctx.font = `48px ${sans}`
  ctx.fillStyle = model.pbThen ? accent : text
  ctx.fillText(model.timeLabel, CSS_WIDTH / 2, y)

  y += 20
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

  y += 20
  ctx.fillStyle = rgba(accent, 0.2)
  ctx.fillRect(40, y, CSS_WIDTH - 80, 1)

  y += 28
  ctx.font = `11px ${sans}`
  ctx.fillStyle = muted
  ctx.fillText('ao5', CSS_WIDTH / 2 - 48, y)
  ctx.fillText('ao12', CSS_WIDTH / 2 + 48, y)
  y += 18
  ctx.font = `16px ${sans}`
  ctx.fillStyle = text
  ctx.fillText(model.ao5, CSS_WIDTH / 2 - 48, y)
  ctx.fillText(model.ao12, CSS_WIDTH / 2 + 48, y)

  if (scrambleLines.length) {
    y += 24
    ctx.font = `13px ${sans}`
    ctx.fillStyle = dim
    for (const line of scrambleLines) {
      ctx.fillText(line, CSS_WIDTH / 2, y)
      y += 18
    }
  }

  if (model.when) {
    y += 18
    ctx.font = `12px ${sans}`
    ctx.fillStyle = muted
    ctx.fillText(model.when, CSS_WIDTH / 2, y)
  }

  return canvasToBlob(canvas)
}
