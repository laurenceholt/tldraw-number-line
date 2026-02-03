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

    const handleNumeratorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { numerator: e.target.value },
      })
    }, [shape.id])

    const handleDenominatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { denominator: e.target.value },
      })
    }, [shape.id])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (e.currentTarget === numeratorRef.current) {
          denominatorRef.current?.focus()
          denominatorRef.current?.select()
        } else {
          // Exit edit mode
          this.editor.setEditingShape(null)
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
    const boxSize = Math.min(w * 0.7, h * 0.35)
    const lineWidth = Math.min(w * 0.8, 50)

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
                placeholder="?"
                style={{
                  width: boxSize,
                  height: boxSize,
                  textAlign: 'center',
                  fontSize: fontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: '2px solid #333',
                  borderRadius: 4,
                  outline: 'none',
                  padding: 0,
                  background: 'white',
                }}
              />
              <div
                style={{
                  width: lineWidth,
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
                placeholder="?"
                style={{
                  width: boxSize,
                  height: boxSize,
                  textAlign: 'center',
                  fontSize: fontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: '2px solid #333',
                  borderRadius: 4,
                  outline: 'none',
                  padding: 0,
                  background: 'white',
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
                      width: boxSize,
                      height: boxSize,
                      border: '2px solid #999',
                      borderRadius: 4,
                      background: 'white',
                    }}
                  />
                  <div
                    style={{
                      width: lineWidth,
                      height: 2,
                      backgroundColor: '#333',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: boxSize,
                      height: boxSize,
                      border: '2px solid #999',
                      borderRadius: 4,
                      background: 'white',
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
                    y={h * 0.35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                    fill="#333"
                  >
                    {numerator || '?'}
                  </text>
                  {/* Fraction line */}
                  <line
                    x1={(w - lineWidth) / 2}
                    y1={h / 2}
                    x2={(w + lineWidth) / 2}
                    y2={h / 2}
                    stroke="#333"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  {/* Denominator */}
                  <text
                    x={w / 2}
                    y={h * 0.65}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                    fill="#333"
                  >
                    {denominator || '?'}
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
