import { Tldraw, Editor, createShapeId, TLUiOverrides, TLUiComponents, DefaultToolbar, DefaultToolbarContent, useEditor, track } from 'tldraw'
import 'tldraw/tldraw.css'
import { NumberLineShapeUtil, NumberLineShape } from './components/NumberLineShape'
import { NumberLinePanel } from './components/NumberLinePanel'
import { NumberLineTool } from './components/NumberLineTool'

const customShapeUtils = [NumberLineShapeUtil]
const customTools = [NumberLineTool]

// UI overrides to add our tool to the tools list
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools['number-line'] = {
      id: 'number-line',
      icon: 'tool-number-line',
      label: 'Number Line',
      kbd: 'l',
      onSelect: () => {
        editor.setCurrentTool('number-line')
      },
    }
    return tools
  },
}

// Custom toolbar item with inline SVG icon
const NumberLineToolbarItem = track(function NumberLineToolbarItem() {
  const editor = useEditor()
  const isSelected = editor.getCurrentToolId() === 'number-line'

  return (
    <button
      className="tlui-button tlui-button__tool"
      data-state={isSelected ? 'selected' : undefined}
      data-tool="number-line"
      aria-label="Number Line"
      title="Number Line (L)"
      onClick={() => editor.setCurrentTool('number-line')}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        {/* Horizontal line */}
        <line x1="2" y1="9" x2="16" y2="9" />
        {/* Three tick marks */}
        <line x1="3" y1="6" x2="3" y2="12" />
        <line x1="9" y1="6" x2="9" y2="12" />
        <line x1="15" y1="6" x2="15" y2="12" />
      </svg>
    </button>
  )
})

// Custom toolbar that includes our number line tool
const components: TLUiComponents = {
  Toolbar: (props) => {
    return (
      <DefaultToolbar {...props}>
        <DefaultToolbarContent />
        <NumberLineToolbarItem />
      </DefaultToolbar>
    )
  },
}

export default function App() {
  const handleMount = (editor: Editor) => {
    // Check if a number line already exists (from persistence)
    const existingNumberLine = editor
      .getCurrentPageShapes()
      .find((s) => s.type === 'number-line')

    // If no number line exists, create one
    if (!existingNumberLine) {
      editor.createShape<NumberLineShape>({
        id: createShapeId(),
        type: 'number-line',
        x: 100,
        y: 100,
        props: {
          w: 520,
          h: 100,
          startValue: 0,
          endValue: 3,
          partition: 1,
          dots: [],
        },
      })
    }
  }

  return (
    <div className="app-container">
      <Tldraw
        persistenceKey="tldraw-number-line"
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={uiOverrides}
        components={components}
        onMount={handleMount}
      >
        <NumberLinePanel />
      </Tldraw>
    </div>
  )
}
