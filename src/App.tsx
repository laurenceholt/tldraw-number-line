import { Tldraw, Editor, createShapeId, TLUiOverrides, TLUiComponents, DefaultToolbar, DefaultToolbarContent, useEditor, track } from 'tldraw'
import 'tldraw/tldraw.css'
import { NumberLineShapeUtil, NumberLineShape } from './components/NumberLineShape'
import { NumberLinePanel } from './components/NumberLinePanel'
import { NumberLineTool } from './components/NumberLineTool'
import { FractionShapeUtil } from './components/FractionShape'
import { FractionTool } from './components/FractionTool'
import { MixedNumberShapeUtil } from './components/MixedNumberShape'
import { MixedNumberTool } from './components/MixedNumberTool'

const customShapeUtils = [NumberLineShapeUtil, FractionShapeUtil, MixedNumberShapeUtil]
const customTools = [NumberLineTool, FractionTool, MixedNumberTool]

// UI overrides to add our tools to the tools list
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
    tools['fraction'] = {
      id: 'fraction',
      icon: 'tool-fraction',
      label: 'Fraction',
      kbd: 'f',
      onSelect: () => {
        editor.setCurrentTool('fraction')
      },
    }
    tools['mixed-number'] = {
      id: 'mixed-number',
      icon: 'tool-mixed-number',
      label: 'Mixed Number',
      kbd: 'm',
      onSelect: () => {
        editor.setCurrentTool('mixed-number')
      },
    }
    return tools
  },
}

// Custom toolbar item with inline SVG icon for Number Line
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

// Custom toolbar item for Fraction tool
const FractionToolbarItem = track(function FractionToolbarItem() {
  const editor = useEditor()
  const isSelected = editor.getCurrentToolId() === 'fraction'

  return (
    <button
      className="tlui-button tlui-button__tool"
      data-state={isSelected ? 'selected' : undefined}
      data-tool="fraction"
      aria-label="Fraction"
      title="Fraction (F)"
      onClick={() => editor.setCurrentTool('fraction')}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#999" strokeWidth="1.5">
        {/* Top box (numerator) */}
        <rect x="5" y="1" width="8" height="5" rx="1" fill="#e0e0e0" />
        {/* Fraction line */}
        <line x1="6" y1="9" x2="12" y2="9" strokeLinecap="round" />
        {/* Bottom box (denominator) */}
        <rect x="5" y="12" width="8" height="5" rx="1" fill="#e0e0e0" />
      </svg>
    </button>
  )
})

// Custom toolbar item for Mixed Number tool
const MixedNumberToolbarItem = track(function MixedNumberToolbarItem() {
  const editor = useEditor()
  const isSelected = editor.getCurrentToolId() === 'mixed-number'

  return (
    <button
      className="tlui-button tlui-button__tool"
      data-state={isSelected ? 'selected' : undefined}
      data-tool="mixed-number"
      aria-label="Mixed Number"
      title="Mixed Number (M)"
      onClick={() => editor.setCurrentTool('mixed-number')}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#999" strokeWidth="1.5">
        {/* Large left box (whole number) */}
        <rect x="1" y="4" width="7" height="10" rx="1" fill="#e0e0e0" />
        {/* Top right box (numerator) */}
        <rect x="10" y="1" width="6" height="5" rx="1" fill="#e0e0e0" />
        {/* Fraction line */}
        <line x1="10" y1="9" x2="16" y2="9" strokeLinecap="round" />
        {/* Bottom right box (denominator) */}
        <rect x="10" y="12" width="6" height="5" rx="1" fill="#e0e0e0" />
      </svg>
    </button>
  )
})

// Custom toolbar that includes our custom tools
const components: TLUiComponents = {
  Toolbar: (props) => {
    return (
      <DefaultToolbar {...props}>
        <DefaultToolbarContent />
        <NumberLineToolbarItem />
        <FractionToolbarItem />
        <MixedNumberToolbarItem />
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
