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
type MixedNumberShapeProps = {
  w: number
  h: number
  whole: string
  numerator: string
  denominator: string
  suffix: string
}

// Define the shape type
export type MixedNumberShape = TLBaseShape<'mixed-number', MixedNumberShapeProps>

export class MixedNumberShapeUtil extends ShapeUtil<MixedNumberShape> {
  static override type = 'mixed-number' as const

  getDefaultProps(): MixedNumberShapeProps {
    return {
      w: 100,
      h: 60,
      whole: '',
      numerator: '',
      denominator: '',
      suffix: '',
    }
  }

  getGeometry(shape: MixedNumberShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize: TLOnResizeHandler<MixedNumberShape> = (shape, info) => {
    return resizeBox(shape, info)
  }

  component(shape: MixedNumberShape) {
    const { w, h, whole, numerator, denominator, suffix } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const isEmpty = !whole && !numerator && !denominator && !suffix

    const wholeRef = useRef<HTMLInputElement>(null)
    const numeratorRef = useRef<HTMLInputElement>(null)
    const denominatorRef = useRef<HTMLInputElement>(null)
    const suffixRef = useRef<HTMLInputElement>(null)

    // Focus whole number input when entering edit mode
    useEffect(() => {
      if (isEditing && wholeRef.current) {
        wholeRef.current.focus()
        wholeRef.current.select()
      }
    }, [isEditing])

    // Auto-resize shape if content is wider than bounding box
    const autoResizeIfNeeded = useCallback((newWhole: string, newNumerator: string, newDenominator: string, newSuffix: string) => {
      const currentFontSize = Math.min(w, h) * 0.35
      const wholeFontSize = currentFontSize * 1.4
      const wholeWidth = Math.max(20, newWhole.length * wholeFontSize * 0.7 + 5)
      const fractionMaxLen = Math.max(newNumerator.length, newDenominator.length, 1)
      const fractionWidth = Math.max(20, fractionMaxLen * currentFontSize * 0.7 + 5)
      const suffixWidth = newSuffix.length * currentFontSize * 0.6
      const gap = 2
      const neededWidth = wholeWidth + gap + fractionWidth + (newSuffix ? gap + suffixWidth : 0) + 10

      if (neededWidth > w) {
        this.editor.updateShape<MixedNumberShape>({
          id: shape.id,
          type: 'mixed-number',
          props: { w: neededWidth },
        })
      }
    }, [shape.id, w, h])

    const handleWholeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<MixedNumberShape>({
        id: shape.id,
        type: 'mixed-number',
        props: { whole: newValue },
      })
      autoResizeIfNeeded(newValue, numerator, denominator, suffix)
    }, [shape.id, numerator, denominator, suffix, autoResizeIfNeeded])

    const handleNumeratorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<MixedNumberShape>({
        id: shape.id,
        type: 'mixed-number',
        props: { numerator: newValue },
      })
      autoResizeIfNeeded(whole, newValue, denominator, suffix)
    }, [shape.id, whole, denominator, suffix, autoResizeIfNeeded])

    const handleDenominatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<MixedNumberShape>({
        id: shape.id,
        type: 'mixed-number',
        props: { denominator: newValue },
      })
      autoResizeIfNeeded(whole, numerator, newValue, suffix)
    }, [shape.id, whole, numerator, suffix, autoResizeIfNeeded])

    const handleSuffixChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      this.editor.updateShape<MixedNumberShape>({
        id: shape.id,
        type: 'mixed-number',
        props: { suffix: newValue },
      })
      autoResizeIfNeeded(whole, numerator, denominator, newValue)
    }, [shape.id, whole, numerator, denominator, autoResizeIfNeeded])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        // Exit edit mode
        this.editor.setEditingShape(null)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        // Cycle through: whole -> numerator -> denominator -> suffix -> whole
        if (e.currentTarget === wholeRef.current) {
          numeratorRef.current?.focus()
          numeratorRef.current?.select()
        } else if (e.currentTarget === numeratorRef.current) {
          denominatorRef.current?.focus()
          denominatorRef.current?.select()
        } else if (e.currentTarget === denominatorRef.current) {
          suffixRef.current?.focus()
          suffixRef.current?.select()
        } else {
          wholeRef.current?.focus()
          wholeRef.current?.select()
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
    const wholeFontSize = fontSize * 1.4
    const boxHeight = Math.min(w * 0.4, h * 0.38)
    const wholeBoxSize = Math.min(w * 0.5, h * 0.7)
    const lineWidth = fontSize * 0.7 // just wider than a single digit
    const gap = 4 // margin between whole/fraction and fraction/suffix

    // Calculate dynamic widths based on content length
    const wholeBoxWidth = Math.max(wholeBoxSize * 0.6, whole.length * wholeFontSize * 0.6)
    const fractionMaxLen = Math.max(numerator.length, denominator.length, 1)
    const fractionBoxWidth = Math.max(boxHeight, fractionMaxLen * fontSize * 0.6)
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
              {/* Whole number box */}
              <input
                ref={wholeRef}
                type="text"
                value={whole}
                onChange={handleWholeChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                style={{
                  width: wholeBoxWidth,
                  height: wholeBoxSize,
                  textAlign: 'center',
                  fontSize: wholeFontSize * 0.8,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  border: '2px solid #999',
                  borderRadius: 4,
                  outline: 'none',
                  padding: '0 4px',
                  background: 'white',
                  minWidth: wholeBoxSize * 0.5,
                }}
              />
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
                    width: fractionBoxWidth,
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
                    width: Math.max(lineWidth, fractionBoxWidth),
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
                    width: fractionBoxWidth,
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
            // Display mode: show mixed number or placeholder boxes
            <>
              {isEmpty ? (
                // Show placeholder boxes when empty (no suffix placeholder - it's invisible)
                <>
                  {/* Whole number placeholder */}
                  <div
                    style={{
                      width: wholeBoxSize * 0.6,
                      height: wholeBoxSize,
                      border: '2px solid #999',
                      borderRadius: 4,
                      background: '#e0e0e0',
                    }}
                  />
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
                // Show the actual mixed number with suffix
                <svg
                  width={w}
                  height={h}
                  style={{ overflow: 'visible' }}
                >
                  {/* Calculate positions */}
                  {(() => {
                    const wholeTextWidth = whole.length * wholeFontSize * 0.6
                    const fractionLineWidth = Math.max(lineWidth, fractionBoxWidth)
                    const suffixWidth = suffix.length * fontSize * 0.6
                    const totalWidth = wholeTextWidth + gap + fractionLineWidth + (suffix ? gap + suffixWidth : 0)

                    const startX = (w - totalWidth) / 2
                    const wholeCenterX = startX + wholeTextWidth / 2
                    const fractionCenterX = startX + wholeTextWidth + gap + fractionLineWidth / 2
                    const suffixX = fractionCenterX + fractionLineWidth / 2 + gap

                    return (
                      <>
                        {/* Whole number */}
                        <text
                          x={wholeCenterX}
                          y={h / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={wholeFontSize}
                          fontFamily="system-ui, sans-serif"
                          fontWeight="600"
                          fill="#333"
                        >
                          {whole}
                        </text>
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

  indicator(shape: MixedNumberShape) {
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
