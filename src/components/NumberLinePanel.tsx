import { useEditor, track } from 'tldraw'
import { NumberLineShape } from './NumberLineShape'
import './NumberLinePanel.css'

export const NumberLinePanel = track(() => {
  const editor = useEditor()

  // Get selected number line shapes
  const selectedShapes = editor.getSelectedShapes()
  const numberLineShapes = selectedShapes.filter(
    (s): s is NumberLineShape => s.type === 'number-line'
  )

  // Only show if exactly one number line is selected and showSettings is true
  if (numberLineShapes.length !== 1) {
    return null
  }

  const shape = numberLineShapes[0]
  const { startValue, endValue, showSettings } = shape.props

  // Don't render if settings are hidden
  if (!showSettings) {
    return null
  }

  // Get the shape's screen position
  const shapePageBounds = editor.getShapePageBounds(shape.id)
  if (!shapePageBounds) return null

  // Convert page coordinates to screen coordinates
  const screenPoint = editor.pageToScreen({ x: shapePageBounds.x, y: shapePageBounds.y })
  const screenWidth = shapePageBounds.width * editor.getZoomLevel()

  const updateProps = (updates: Partial<NumberLineShape['props']>) => {
    editor.updateShape<NumberLineShape>({
      id: shape.id,
      type: 'number-line',
      props: updates,
    })
  }

  const closeSettings = () => {
    updateProps({ showSettings: false })
  }

  return (
    <div
      className="number-line-panel"
      style={{
        left: screenPoint.x + screenWidth,
        top: screenPoint.y - 8,
        transform: 'translate(-100%, -100%)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="panel-header">
        <span className="panel-title">Settings</span>
        <button
          className="close-button"
          onClick={closeSettings}
          title="Close"
        >
          ×
        </button>
      </div>

      <div className="panel-controls">
        <div className="panel-row">
          <label htmlFor="nl-start">Start:</label>
          <input
            id="nl-start"
            type="number"
            value={startValue}
            onChange={(e) => updateProps({ startValue: Number(e.target.value) })}
          />
        </div>

        <div className="panel-row">
          <label htmlFor="nl-end">End:</label>
          <input
            id="nl-end"
            type="number"
            value={endValue}
            onChange={(e) => updateProps({ endValue: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Arrow pointing down to the widget */}
      <div className="panel-arrow" />
    </div>
  )
})
