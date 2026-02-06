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
  suffix: string
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
      suffix: '',
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
    const { w, h, numerator, denominator, suffix } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const isEmpty = !numerator && !denominator && !suffix

    const numeratorRef = useRef<HTMLInputElement>(null)
    const denominatorRef = useRef<HTMLInputElement>(null)
    const suffixRef = useRef<HTMLInputElement>(null)

    // Focus numerator input when entering edit mode
    useEffect(() => {
      if (isEditing && numeratorRef.current) {
        numeratorRef.current.focus()
        numeratorRef.current.select()
      }
    }, [isEditing])

    // Auto-resize shape if content is wider than bounding box
    const autoResizeIfNeeded = useCallback((newNumerator: string, newDenominator: string, newSuffix: string) => {
      const maxLen = Math.max(newNumerator.length, newDenominator.length, 1)
      const currentFontSize = Math.min(w, h) * 0.35
      const fractionWidth = Math.max(40, maxLen * currentFontSize * 0.7 + 10)
      const suffixWidth = newSuffix.length * currentFontSize * 0.6
      const gap = 2 // consistent small gap
      const neededWidth = fractionWidth + (newSuffix ? gap + suffixWidth : 0) + 10

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
      autoResizeIfNeeded(newValue, denominator, suffix)
    }, [shape.id, denominator, suffix, autoResizeIfNeeded])

    const handleDenominatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { denominator: newValue },
      })
      autoResizeIfNeeded(numerator, newValue, suffix)
    }, [shape.id, numerator, suffix, autoResizeIfNeeded])

    const handleSuffixChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<FractionShape>({
        id: shape.id,
        type: 'fraction',
        props: { suffix: newValue },
      })
      autoResizeIfNeeded(numerator, denominator, newValue)
    }, [shape.id, numerator, denominator, autoResizeIfNeeded])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        // Exit edit mode
        this.editor.setEditingShape(null)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        // Cycle through: numerator -> denominator -> suffix -> numerator
        if (e.currentTarget === numeratorRef.current) {
          denominatorRef.current?.focus()
          denominatorRef.current?.select()
        } else if (e.currentTarget === denominatorRef.current) {
          suffixRef.current?.focus()
          suffixRef.current?.select()
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
    const lineWidth = fontSize * 0.7 // just wider than a single digit
    const gap = 4 // margin between fraction and suffix

    // Calculate dynamic width based on content length
    const maxContentLength = Math.max(numerator.length, denominator.length, 1)
    const dynamicBoxWidth = Math.max(boxHeight, maxContentLength * fontSize * 0.6)
    const suffixBoxWidth = Math.max(boxHeight * 0.6, suffix.length * fontSize * 0.6)

    return (
      <HTMLContainer id={shape.id}>
        <div
          style={{
            width: w,
            height: h,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: isEditing ? 'all' : 'none',
            gap: gap,
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
              {/* Fraction part */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: gap,
                }}
              >
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
              </div>
              {/* Suffix input - invisible box, just shows cursor */}
              <input
                ref={suffixRef}
                type="text"
                value={suffix}
                onChange={handleSuffixChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                style={{
                  width: Math.max(fontSize * 0.5, suffixBoxWidth),
                  height: boxHeight,
                  textAlign: 'left',
                  fontSize: fontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  background: 'transparent',
                  caretColor: '#333',
                }}
              />
            </>
          ) : (
            // Display mode: show fraction or placeholder boxes
            <>
              {isEmpty ? (
                // Show placeholder boxes when empty (no suffix placeholder - it's invisible)
                <>
                  {/* Fraction placeholder */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
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
                  </div>
                </>
              ) : (
                // Show the actual fraction with suffix
                <svg
                  width={w}
                  height={h}
                  style={{ overflow: 'visible' }}
                >
                  {/* Calculate positions */}
                  {(() => {
                    const fractionLineWidth = Math.max(lineWidth, dynamicBoxWidth)
                    const suffixWidth = suffix.length * fontSize * 0.6
                    const totalWidth = fractionLineWidth + (suffix ? gap + suffixWidth : 0)
                    const fractionCenterX = (w - totalWidth) / 2 + fractionLineWidth / 2
                    const suffixX = fractionCenterX + fractionLineWidth / 2 + gap

                    return (
                      <>
                        {/* Numerator */}
                        <text
                          x={fractionCenterX}
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
                          x1={fractionCenterX - fractionLineWidth / 2}
                          y1={h / 2}
                          x2={fractionCenterX + fractionLineWidth / 2}
                          y2={h / 2}
                          stroke="#333"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                        {/* Denominator */}
                        <text
                          x={fractionCenterX}
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
                        {/* Suffix */}
                        {suffix && (
                          <text
                            x={suffixX}
                            y={h / 2}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fontSize={fontSize}
                            fontFamily="system-ui, sans-serif"
                            fontWeight="600"
                            fill="#333"
                          >
                            {suffix}
                          </text>
                        )}
                      </>
                    )
                  })()}
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
