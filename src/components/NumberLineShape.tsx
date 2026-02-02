import {
  ShapeUtil,
  TLBaseShape,
  Rectangle2d,
  resizeBox,
  TLOnResizeHandler,
  HTMLContainer,
  stopEventPropagation,
} from 'tldraw'

// Accessible teal color (WCAG AA compliant - 5.62:1 contrast ratio)
const DOT_COLOR = '#0D7377'

// Define the shape's properties
type NumberLineShapeProps = {
  w: number
  h: number
  startValue: number
  endValue: number
  partition: number
  dots: Array<{ numerator: number; denominator: number; showMixed?: boolean }> // Position stored as fraction to preserve when partition changes
  showSettings: boolean
}

// Define the shape type
export type NumberLineShape = TLBaseShape<'number-line', NumberLineShapeProps>

// Convert dot's stored fraction to a position value on the number line
function dotToPosition(dot: { numerator: number; denominator: number }, startValue: number): number {
  return startValue + dot.numerator / dot.denominator
}

// Helper to compute GCD for fraction simplification
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

// Simplify a fraction
function simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
  const divisor = gcd(numerator, denominator)
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}

// Convert improper fraction to mixed number (with simplified fraction part)
function toMixedNumber(numerator: number, denominator: number): { whole: number; numerator: number; denominator: number } | null {
  if (numerator < denominator) {
    return null // Not an improper fraction
  }
  const whole = Math.floor(numerator / denominator)
  const remainder = numerator % denominator
  // Simplify the fractional part
  const simplified = simplifyFraction(remainder, denominator)
  return { whole, numerator: simplified.numerator, denominator: simplified.denominator }
}

export class NumberLineShapeUtil extends ShapeUtil<NumberLineShape> {
  static override type = 'number-line' as const

  getDefaultProps(): NumberLineShapeProps {
    return {
      w: 520,
      h: 100,
      startValue: 0,
      endValue: 3,
      partition: 1,
      dots: [],
      showSettings: false,
    }
  }

  getGeometry(shape: NumberLineShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override canResize = () => true

  override onResize: TLOnResizeHandler<NumberLineShape> = (shape, info) => {
    return resizeBox(shape, info)
  }

  component(shape: NumberLineShape) {
    const { w, h, startValue, endValue, partition, dots, showSettings } = shape.props
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id)

    // Layout calculations
    const padding = 40
    const lineY = h / 2
    const lineStart = padding
    const lineEnd = w - padding
    const lineLength = lineEnd - lineStart

    const range = endValue - startValue
    const isValidRange = range > 0

    // Calculate total number of segments
    const totalSegments = isValidRange ? range * partition : 1
    const segmentWidth = isValidRange ? lineLength / totalSegments : lineLength

    // Generate tick marks
    const ticks: Array<{
      x: number
      value: number
      isInteger: boolean
      label?: string
      fractionLabel?: { numerator: number; denominator: number }
    }> = []

    if (isValidRange) {
      for (let i = 0; i <= totalSegments; i++) {
        const x = lineStart + i * segmentWidth
        const value = startValue + i / partition
        const isInteger = i % partition === 0
        const isFirstPartition = partition > 1 && i === 1

        let label: string | undefined
        let fractionLabel: { numerator: number; denominator: number } | undefined
        if (isInteger) {
          label = Math.round(value).toString()
        } else if (isFirstPartition) {
          fractionLabel = { numerator: 1, denominator: partition }
        }

        ticks.push({ x, value, isInteger, label, fractionLabel })
      }
    }

    // Convert click position to value and handle dot add/remove
    const handleLineClick = (e: React.PointerEvent<HTMLDivElement>) => {
      // Only handle dot placement when select tool is active
      const currentTool = this.editor.getCurrentToolId()
      if (currentTool !== 'select') return

      if (!isValidRange) return

      // Get click position relative to shape, accounting for zoom
      const zoom = this.editor.getZoomLevel()
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = (e.clientX - rect.left) / zoom
      const clickY = (e.clientY - rect.top) / zoom

      // Check if clicking on a fraction label above a dot (to toggle mixed number)
      const fractionLabelIndex = dots.findIndex(dot => {
        const dotPosition = dotToPosition(dot, startValue)
        const dotX = lineStart + ((dotPosition - startValue) / range) * lineLength
        // Check if click is in the fraction label area (above the dot)
        const inXRange = Math.abs(dotX - clickX) < 20
        const inYRange = clickY >= lineY - 50 && clickY <= lineY - 10
        return inXRange && inYRange
      })

      if (fractionLabelIndex !== -1) {
        // Toggle mixed number display for this dot
        e.stopPropagation()
        const newDots = [...dots]
        newDots[fractionLabelIndex] = {
          ...newDots[fractionLabelIndex],
          showMixed: !newDots[fractionLabelIndex].showMixed
        }
        this.editor.updateShape<NumberLineShape>({
          id: shape.id,
          type: 'number-line',
          props: { dots: newDots },
        })
        return
      }

      // Check if click is in the number line area (with some tolerance)
      if (clickY < lineY - 25 || clickY > lineY + 25) return
      if (clickX < lineStart - 10 || clickX > lineEnd + 10) return

      // Only stop propagation if we're actually handling a dot interaction
      e.stopPropagation()

      // Check if clicking on existing dot (to remove)
      const existingDotIndex = dots.findIndex(dot => {
        const dotPosition = dotToPosition(dot, startValue)
        const dotX = lineStart + ((dotPosition - startValue) / range) * lineLength
        return Math.abs(dotX - clickX) < 12
      })

      if (existingDotIndex !== -1) {
        // Remove dot
        const newDots = [...dots]
        newDots.splice(existingDotIndex, 1)
        this.editor.updateShape<NumberLineShape>({
          id: shape.id,
          type: 'number-line',
          props: { dots: newDots },
        })
        return
      }

      // Find nearest tick for snapping (always snap to closest tick)
      let snappedTick = ticks[0]
      let minDistance = Infinity
      for (const tick of ticks) {
        const tickX = tick.x
        const distance = Math.abs(tickX - clickX)
        if (distance < minDistance) {
          minDistance = distance
          snappedTick = tick
        }
      }

      // Calculate the numerator for this tick position
      // The tick's value is startValue + i/partition, so numerator = (value - startValue) * partition
      const numerator = Math.round((snappedTick.value - startValue) * partition)

      // Add new dot with fraction representation
      const newDots = [...dots, { numerator, denominator: partition }]
      this.editor.updateShape<NumberLineShape>({
        id: shape.id,
        type: 'number-line',
        props: { dots: newDots },
      })
    }

    const toggleSettings = (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      this.editor.updateShape<NumberLineShape>({
        id: shape.id,
        type: 'number-line',
        props: { showSettings: !showSettings },
      })
    }

    return (
      <HTMLContainer id={shape.id}>
        <div
          style={{
            width: w,
            height: h,
            position: 'relative',
            pointerEvents: 'all',
          }}
          onPointerDown={handleLineClick}
        >
          <svg
            width={w}
            height={h}
            style={{
              overflow: 'visible',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              cursor: isValidRange ? 'crosshair' : 'default',
            }}
          >
            {/* Background */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              rx={8}
              ry={8}
              fill="white"
              stroke="#e0e0e0"
              strokeWidth={1}
            />

            {/* Main horizontal line with arrows */}
            {isValidRange && (
              <>
                {/* Main line (extended to arrows) */}
                <line
                  x1={lineStart - 10}
                  y1={lineY}
                  x2={lineEnd + 10}
                  y2={lineY}
                  stroke="#333"
                  strokeWidth={2}
                />
                {/* Left arrow (solid, rounded corners) */}
                <polygon
                  points={`${lineStart - 16},${lineY} ${lineStart - 10},${lineY - 3.5} ${lineStart - 10},${lineY + 3.5}`}
                  fill="#333"
                  strokeLinejoin="round"
                  stroke="#333"
                  strokeWidth={2}
                />
                {/* Right arrow (solid, rounded corners) */}
                <polygon
                  points={`${lineEnd + 16},${lineY} ${lineEnd + 10},${lineY - 3.5} ${lineEnd + 10},${lineY + 3.5}`}
                  fill="#333"
                  strokeLinejoin="round"
                  stroke="#333"
                  strokeWidth={2}
                />

                {/* Tick marks and labels */}
                {ticks.map((tick, index) => {
                  const tickHeight = tick.isInteger ? 16 : 10
                  const tickY1 = lineY - tickHeight / 2
                  const tickY2 = lineY + tickHeight / 2

                  return (
                    <g key={index}>
                      <line
                        x1={tick.x}
                        y1={tickY1}
                        x2={tick.x}
                        y2={tickY2}
                        stroke="#333"
                        strokeWidth={tick.isInteger ? 2 : 1}
                      />
                      {tick.label && (
                        <text
                          x={tick.x}
                          y={lineY + 28}
                          textAnchor="middle"
                          fontSize={tick.isInteger ? 14 : 12}
                          fontFamily="system-ui, sans-serif"
                          fill="#333"
                        >
                          {tick.label}
                        </text>
                      )}
                      {tick.fractionLabel && (
                        <g>
                          {/* Stacked fraction: numerator */}
                          <text
                            x={tick.x}
                            y={lineY + 20}
                            textAnchor="middle"
                            fontSize={11}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="500"
                            fill="#333"
                          >
                            {tick.fractionLabel.numerator}
                          </text>
                          {/* Fraction line */}
                          <line
                            x1={tick.x - 6}
                            y1={lineY + 26}
                            x2={tick.x + 6}
                            y2={lineY + 26}
                            stroke="#333"
                            strokeWidth={1.5}
                          />
                          {/* Stacked fraction: denominator */}
                          <text
                            x={tick.x}
                            y={lineY + 38}
                            textAnchor="middle"
                            fontSize={11}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="500"
                            fill="#333"
                          >
                            {tick.fractionLabel.denominator}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Dots */}
                {dots.map((dot, index) => {
                  const dotPosition = dotToPosition(dot, startValue)
                  const dotX = lineStart + ((dotPosition - startValue) / range) * lineLength
                  const mixed = dot.showMixed ? toMixedNumber(dot.numerator, dot.denominator) : null

                  return (
                    <g key={index} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={dotX}
                        cy={lineY}
                        r={8}
                        fill={DOT_COLOR}
                        stroke="white"
                        strokeWidth={2}
                      />
                      {/* Fraction label - clickable to toggle mixed number */}
                      {mixed && mixed.numerator > 0 ? (
                        // Mixed number with fraction part (e.g., 1 1/2)
                        <g>
                          {/* Whole number */}
                          <text
                            x={dotX - 5}
                            y={lineY - 20}
                            textAnchor="middle"
                            fontSize={15}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill={DOT_COLOR}
                          >
                            {mixed.whole}
                          </text>
                          {/* Stacked fraction: numerator */}
                          <text
                            x={dotX + 5}
                            y={lineY - 30}
                            textAnchor="middle"
                            fontSize={9}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill={DOT_COLOR}
                          >
                            {mixed.numerator}
                          </text>
                          {/* Fraction line */}
                          <line
                            x1={dotX + 1}
                            y1={lineY - 25}
                            x2={dotX + 9}
                            y2={lineY - 25}
                            stroke={DOT_COLOR}
                            strokeWidth={1.5}
                          />
                          {/* Stacked fraction: denominator */}
                          <text
                            x={dotX + 5}
                            y={lineY - 15}
                            textAnchor="middle"
                            fontSize={9}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill={DOT_COLOR}
                          >
                            {mixed.denominator}
                          </text>
                        </g>
                      ) : mixed && mixed.numerator === 0 ? (
                        // Whole number only (e.g., 3/3 = 1)
                        <text
                          x={dotX}
                          y={lineY - 18}
                          textAnchor="middle"
                          fontSize={13}
                          fontFamily="system-ui, sans-serif"
                          fontWeight="600"
                          fill={DOT_COLOR}
                        >
                          {mixed.whole}
                        </text>
                      ) : (
                        // Improper fraction (default)
                        <g>
                          {/* Stacked fraction: numerator */}
                          <text
                            x={dotX}
                            y={lineY - 30}
                            textAnchor="middle"
                            fontSize={9}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill={DOT_COLOR}
                          >
                            {dot.numerator}
                          </text>
                          {/* Fraction line */}
                          <line
                            x1={dotX - 5}
                            y1={lineY - 25}
                            x2={dotX + 5}
                            y2={lineY - 25}
                            stroke={DOT_COLOR}
                            strokeWidth={1.5}
                          />
                          {/* Stacked fraction: denominator */}
                          <text
                            x={dotX}
                            y={lineY - 15}
                            textAnchor="middle"
                            fontSize={9}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill={DOT_COLOR}
                          >
                            {dot.denominator}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </>
            )}

            {!isValidRange && (
              <text
                x={w / 2}
                y={lineY}
                textAnchor="middle"
                fontSize={13}
                fontFamily="system-ui, sans-serif"
                fill="#999"
              >
                End value must be greater than start value
              </text>
            )}
          </svg>

          {/* Settings cog button (only when selected) */}
          {isSelected && (
            <div
              onPointerDown={toggleSettings}
              onPointerUp={stopEventPropagation}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'all',
              }}
              title="Settings"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: NumberLineShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    )
  }
}
