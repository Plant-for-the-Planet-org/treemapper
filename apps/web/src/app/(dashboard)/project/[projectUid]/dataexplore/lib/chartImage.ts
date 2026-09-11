// Chart image export for the Data Explorer.
//
// Recharts has no download toolbar of its own, so this restores what the old
// platform's ApexCharts toolbar gave us: the chart as PNG or SVG. The CSV half
// of that menu comes from the shared spreadsheet helpers.

import { downloadBlob } from '@/utils/spreadsheet'

const INLINED_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stop-color',
  'stop-opacity',
  'opacity',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
]

/**
 * Recharts paints with CSS custom properties (var(--primary)). Once the SVG is
 * detached from the document those variables no longer resolve, so every
 * painted value is copied from the live computed style onto the clone before
 * serialising.
 */
function inlineStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll('*'))]
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))]

  sourceNodes.forEach((node, index) => {
    const target = cloneNodes[index] as SVGElement | undefined
    if (!target) return
    const computed = window.getComputedStyle(node as Element)
    INLINED_PROPS.forEach((prop) => {
      const value = computed.getPropertyValue(prop)
      if (value) target.style.setProperty(prop, value)
    })
  })
}

function serializeChart(container: HTMLElement): { svg: string; width: number; height: number } | null {
  const source = container.querySelector('svg')
  if (!source) return null

  const rect = source.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))

  const clone = source.cloneNode(true) as SVGSVGElement
  inlineStyles(source as SVGSVGElement, clone)

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  return { svg: new XMLSerializer().serializeToString(clone), width, height }
}

export function downloadChartSvg(container: HTMLElement, filename: string) {
  const result = serializeChart(container)
  if (!result) return
  downloadBlob(new Blob([result.svg], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`)
}

/**
 * Rasterises the chart at 2x on an opaque background, so the PNG is readable
 * when pasted into a slide regardless of the viewer's theme.
 */
export async function downloadChartPng(
  container: HTMLElement,
  filename: string,
  background = '#ffffff',
) {
  const result = serializeChart(container)
  if (!result) return

  const scale = 2
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`

  await new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = result.width * scale
      canvas.height = result.height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve()

      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`)
        resolve()
      }, 'image/png')
    }
    image.onerror = () => resolve()
    image.src = url
  })
}
