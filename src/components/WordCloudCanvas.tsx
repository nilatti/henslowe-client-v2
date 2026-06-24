import { useEffect, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloud = require('d3-cloud') as () => D3Cloud

interface Word {
  text: string
  value: number
}

interface PositionedWord {
  text: string
  value: number
  x: number
  y: number
  rotate: number
  size: number
}

interface D3Cloud {
  size(s: [number, number]): D3Cloud
  words(w: object[]): D3Cloud
  padding(p: number): D3Cloud
  rotate(fn: () => number): D3Cloud
  font(f: string): D3Cloud
  fontSize(fn: (d: { size: number }) => number): D3Cloud
  on(event: 'end', cb: (words: PositionedWord[]) => void): D3Cloud
  start(): D3Cloud
  stop(): D3Cloud
}

const COLORS = [
  '#1d4ed8', '#15803d', '#b91c1c', '#7e22ce',
  '#c2410c', '#0e7490', '#92400e', '#1e40af',
  '#166534', '#9f1239',
]

function fontSizeFor(value: number, min: number, max: number): number {
  if (max === min) return 32
  return 12 + Math.sqrt((value - min) / (max - min)) * 60
}

function pickRotation(): number {
  const r = Math.random()
  if (r < 0.6) return 0
  return Math.random() > 0.5 ? 90 : -90
}

export interface WordCloudCanvasProps {
  words: Word[]
  width?: number
  height?: number
  onWordClick?: (word: Word) => void
}

export function WordCloudCanvas({
  words,
  width = 600,
  height = 400,
  onWordClick,
}: WordCloudCanvasProps) {
  const [positioned, setPositioned] = useState<PositionedWord[]>([])
  const [laying, setLaying] = useState(false)

  useEffect(() => {
    if (!words.length) {
      setPositioned([])
      return
    }
    setLaying(true)

    const min = Math.min(...words.map(w => w.value))
    const max = Math.max(...words.map(w => w.value))

    const layout = cloud()
      .size([width, height])
      .words(words.map(w => ({ ...w, size: fontSizeFor(w.value, min, max) })))
      .padding(5)
      .rotate(pickRotation)
      .font('sans-serif')
      .fontSize((d: { size: number }) => d.size)
      .on('end', (placed: PositionedWord[]) => {
        setPositioned(placed)
        setLaying(false)
      })

    layout.start()
    return () => { layout.stop() }
  }, [words, width, height])

  if (!words.length) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-gray-400 text-sm"
      >
        No words selected
      </div>
    )
  }

  if (laying && !positioned.length) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-gray-400 text-sm"
      >
        Laying out cloud…
      </div>
    )
  }

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {positioned.map((w, i) => (
          <text
            key={w.text}
            style={{
              fontSize: w.size,
              fontFamily: 'sans-serif',
              fill: COLORS[i % COLORS.length],
              cursor: onWordClick ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            textAnchor="middle"
            transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
            onClick={() => onWordClick?.({ text: w.text, value: w.value })}
          >
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  )
}
