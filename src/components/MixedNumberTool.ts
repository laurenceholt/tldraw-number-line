import { StateNode, TLEventHandlers, createShapeId } from 'tldraw'

class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    this.parent.transition('pointing', info)
  }
}

class Pointing extends StateNode {
  static override id = 'pointing'

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    const { editor } = this
    const zoom = editor.getZoomLevel()
    const { currentPagePoint } = editor.inputs

    const shapeId = createShapeId()

    editor.createShape({
      id: shapeId,
      type: 'mixed-number',
      x: currentPagePoint.x / zoom,
      y: currentPagePoint.y / zoom,
      props: {
        w: 100,
        h: 60,
        whole: '',
        numerator: '',
        denominator: '',
      },
    })

    // Enter edit mode immediately
    editor.setEditingShape(shapeId)
    editor.select(shapeId)

    this.parent.transition('idle')
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (this.editor.inputs.isDragging) {
      this.parent.transition('idle')
    }
  }
}

export class MixedNumberTool extends StateNode {
  static override id = 'mixed-number'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing]
}
