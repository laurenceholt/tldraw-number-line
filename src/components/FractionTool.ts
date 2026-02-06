import { StateNode, TLEventHandlers } from 'tldraw'

// Idle state - waiting for user to click
class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    this.parent.transition('pointing', info)
  }

  override onCancel = () => {
    this.editor.setCurrentTool('select')
  }
}

// Pointing state - user has clicked, create the shape
class Pointing extends StateNode {
  static override id = 'pointing'

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    const { currentPagePoint } = this.editor.inputs

    this.editor.createShape({
      type: 'fraction',
      x: currentPagePoint.x - 30, // Center the shape on click
      y: currentPagePoint.y - 30,
      props: {
        w: 60,
        h: 60,
        numerator: '',
        denominator: '',
        suffix: '',
      },
    })

    // Get the newly created shape and enter edit mode
    const shapes = this.editor.getCurrentPageShapes()
    const newShape = shapes[shapes.length - 1]
    if (newShape) {
      this.editor.select(newShape.id)
      this.editor.setEditingShape(newShape.id)
    }

    this.parent.transition('idle')
  }

  override onCancel = () => {
    this.parent.transition('idle')
  }
}

// Main Fraction Tool
export class FractionTool extends StateNode {
  static override id = 'fraction'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing]
}
