import {
  ShapeUtil,
  TLBaseShape,
  Rectangle2d,
  HTMLContainer,
  TLOnResizeHandler,
  resizeBox,
} from 'tldraw'
import { useCallback, useRef, useEffect } from 'react'

// Define the shape's properties
type FractionShapeProps = {
  w: number
  h: number
  numerator: string
  denominator: string
}

// Define the shape type
export type FractionShape = TLBaseShape<'fraction', FractionShapeProps>

export class FractionShapeUtil extends ShapeUtil<FractionShape> {
  static override type = 'fraction' as const

  getDefaultProps(): FractionShapeProps {
    return {
      w: 60,
      h: 60,
      numerator: '',
      denominator: '',
    }
  }

  getGeometry(shape: FractionShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize: TLOnResizeHandler<FractionShape> = (shape, info) => {
    return resizeBox(shape, info)
  }

  component(shape: FractionShape) {
    const { w, h, numerator, denominator } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const isEmpty = !numerator && !denominator

    const numeratorRef = useRef<HTMLInputElement>(null)
    const denominatorRef = useRef<HTMLInputElement>(null)

    // Focus numerator input when entering edit mode
    useEffect(() => {
      if (isEditing && numeratorRef.current) {
        numeratorRef.current.focus()
        numeratorRef.current.select()
      }
    }, [isEditing])

    // Auto-resize shape if content is wider than bounding box
    const autoResizeIfNeeded = useCallback((newNumerator: string, newDenominator: string) => {
      const maxLen = Math.max(newNumerator.length, newDenominator.length, 1)
      const currentFontSize = Math.min(w, h) * 0.35
      const neededWidth = Math.max(60, maxLen * currentFontSize * 0.7 + 20)

      if (neededWidth > w) {
        this.editor.updateShape<FractionShape>({
          id: shape.id,
          type: 'fraction',
          props: { w: neededWidth },
        })
      }
    }, [shape.id, w, h])

    const handleNumeratorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { numerator: newValue },
      })
      autoResizeIfNeeded(newValue, denominator)
    }, [shape.id, denominator, autoResizeIfNeeded])

    const handleDenominatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { denominator: newValue },
      })
      autoResizeIfNeeded(numerator, newValue)
    }, [shape.id, numerator, autoResizeIfNeeded])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        // Exit edit mode
        this.editor.setEditingShape(null)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        // Toggle between numerator and denominator
        if (e.currentTarget === numeratorRef.current) {
          denominatorRef.current?.focus()
          denominatorRef.current?.select()
        } else {
          numeratorRef.current?.focus()
          numeratorRef.current?.select()
        }
      }
      if (e.key === 'Escape') {
        this.editor.setEditingShape(null)
      }
      // Prevent event from bubbling to TLDraw
      e.stopPropagation()
    }, [])

    // Calculate sizes based on shape dimensions
    const fontSize = Math.min(w, h) * 0.35
    const boxHeight = Math.min(w * 0.7, h * 0.38)
    const lineWidth = Math.min(w * 0.35, 25)

    // Calculate dynamic width based on content length
    const maxContentLength = Math.max(numerator.length, denominator.length, 1)
    const dynamicBoxWidth = Math.max(boxHeight, maxContentLength * fontSize * 0.6)

    return (
      <HTMLContainer id={shape.id}>
        <div
          style={{
            width: w,
            height: h,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: isEditing ? 'all' : 'none',
            gap: 2,
          }}
          onPointerDown={(e) => {
            if (isEditing) {
              e.stopPropagation()
            }
          }}
        >
          {isEditing ? (
            // Edit mode: show input boxes
            <>
              <input
                ref={numeratorRef}
                type="text"
                value={numerator}
                onChange={handleNumeratorChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                style={{
                  width: dynamicBoxWidth,
                  height: boxHeight,
                  textAlign: 'center',
                  fontSize: fontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: '2px solid #999',
                  borderRadius: 4,
                  outline: 'none',
                  padding: '0 4px',
                  background: 'white',
                  minWidth: boxHeight,
                }}
              />
              <div
                style={{
                  width: Math.max(lineWidth, dynamicBoxWidth),
                  height: 2,
                  backgroundColor: '#333',
                  borderRadius: 1,
                }}
              />
              <input
                ref={denominatorRef}
                type="text"
                value={denominator}
                onChange={handleDenominatorChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                style={{
                  width: dynamicBoxWidth,
                  height: boxHeight,
                  textAlign: 'center',
                  fontSize: fontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: '2px solid #999',
                  borderRadius: 4,
                  outline: 'none',
                  padding: '0 4px',
                  background: 'white',
                  minWidth: boxHeight,
                }}
              />
            </>
          ) : (
            // Display mode: show fraction or placeholder boxes
            <>
              {isEmpty ? (
                // Show placeholder boxes when empty
                <>
                  <div
                    style={{
                      width: boxHeight,
                      height: boxHeight,
                      border: '2px solid #999',
                      borderRadius: 4,
                      background: '#e0e0e0',
                    }}
                  />
                  <div
                    style={{
                      width: lineWidth,
                      height: 2,
                      backgroundColor: '#999',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: boxHeight,
                      height: boxHeight,
                      border: '2px solid #999',
                      borderRadius: 4,
                      background: '#e0e0e0',
                    }}
                  />
                </>
              ) : (
                // Show the actual fraction
                <svg
                  width={w}
                  height={h}
                  style={{ overflow: 'visible' }}
                >
                  {/* Numerator */}
                  <text
                    x={w / 2}
                    y={h * 0.22}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                    fill="#333"
                  >
                    {numerator}
                  </text>
                  {/* Fraction line */}
                  <line
                    x1={(w - Math.max(lineWidth, dynamicBoxWidth)) / 2}
                    y1={h / 2}
                    x2={(w + Math.max(lineWidth, dynamicBoxWidth)) / 2}
                    y2={h / 2}
                    stroke="#333"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  {/* Denominator */}
                  <text
                    x={w / 2}
                    y={h * 0.78}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                    fill="#333"
                  >
                    {denominator}
                  </text>
                </svg>
              )}
            </>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: FractionShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={4}
        ry={4}
      />
    )
  }
}
