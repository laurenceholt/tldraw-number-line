import {
  StateNode,
  TLEventHandlers,
  createShapeId,
} from 'tldraw'
import { NumberLineShape } from './NumberLineShape'

// Idle state - waiting for user to click
class Idle extends StateNode {
  static override id = 'idle'

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

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

  override onEnter = () => {
    const { originPagePoint } = this.editor.inputs

    // Create shape at click point
    const id = createShapeId()
    const shapeWidth = 520
    const shapeHeight = 100

    this.editor.mark('creating number line')

    this.editor.createShape<NumberLineShape>({
      id,
      type: 'number-line',
      x: originPagePoint.x - shapeWidth / 2,
      y: originPagePoint.y - shapeHeight / 2,
      props: {
        w: shapeWidth,
        h: shapeHeight,
        startValue: 0,
        endValue: 3,
        partition: 1,
      },
    })

    this.editor.select(id)
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    this.complete()
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    this.editor.bailToMark('creating number line')
    this.parent.transition('idle')
  }

  override onInterrupt = () => {
    this.cancel()
  }

  private complete() {
    // Return to select tool after placing
    this.editor.setCurrentTool('select')
  }

  private cancel() {
    this.parent.transition('idle')
  }
}

// Main tool
export class NumberLineTool extends StateNode {
  static override id = 'number-line'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing]

  override shapeType = 'number-line'
}
