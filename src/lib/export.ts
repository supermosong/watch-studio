import { VIEW_H, VIEW_W } from '../render/2d/geometry'

function serialize(svg: SVGSVGElement, scale: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(VIEW_W * scale))
  clone.setAttribute('height', String(VIEW_H * scale))
  return new XMLSerializer().serializeToString(clone)
}

function fileName(name: string, ext: string) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'watch'}.${ext}`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportSvg(svg: SVGSVGElement, name: string) {
  download(new Blob([serialize(svg, 1)], { type: 'image/svg+xml' }), fileName(name, 'svg'))
}

/** Saves what a WebGL canvas currently shows (it must use preserveDrawingBuffer). */
export async function exportCanvasPng(canvas: HTMLCanvasElement, name: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG encoding failed')
  download(blob, fileName(name, 'png'))
}

/** Rasterizes the SVG at `scale`× its view size and downloads it as a transparent PNG. */
export async function exportPng(svg: SVGSVGElement, name: string, scale = 3) {
  const url = URL.createObjectURL(new Blob([serialize(svg, scale)], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = VIEW_W * scale
    canvas.height = VIEW_H * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('PNG encoding failed')
    download(blob, fileName(name, 'png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}
