import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { ChevronDownIcon } from './icons'

// Absolute sizes so re-applying or nesting never compounds.
// 'Normal' clears the override and falls back to the entry's base size.
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '' },
  { label: 'Large', value: '24px' },
  { label: 'Huge', value: '32px' },
]

const BASIC_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#008000' },
]

// A varied, clearly-distinguishable palette.
const TEXT_COLORS = [
  { name: 'Red', value: '#E5484D' },
  { name: 'Maroon', value: '#A13333' },
  { name: 'Coral', value: '#FF7F63' },
  { name: 'Orange', value: '#F76B15' },
  { name: 'Amber', value: '#F5A623' },
  { name: 'Yellow', value: '#E7C428' },
  { name: 'Olive', value: '#8A8F3C' },
  { name: 'Green', value: '#46A758' },
  { name: 'Teal', value: '#12A594' },
  { name: 'Cyan', value: '#0BA5C9' },
  { name: 'Sky Blue', value: '#54AEFF' },
  { name: 'Blue', value: '#3E63DD' },
  { name: 'Indigo', value: '#6656CF' },
  { name: 'Purple', value: '#9D5BD2' },
  { name: 'Magenta', value: '#C838C8' },
  { name: 'Pink', value: '#F76BB3' },
  { name: 'Brown', value: '#8D6748' },
  { name: 'Gray', value: '#8B8D98' },
]

const TOGGLE_COMMANDS = [
  { command: 'bold', label: 'B', style: { fontWeight: 700 }, name: 'Bold' },
  { command: 'italic', label: 'I', style: { fontStyle: 'italic' }, name: 'Italic' },
  { command: 'underline', label: 'U', style: { textDecoration: 'underline' }, name: 'Underline' },
  { command: 'strikeThrough', label: 'S', style: { textDecoration: 'line-through' }, name: 'Strikethrough' },
] as const

type ToggleCommand = (typeof TOGGLE_COMMANDS)[number]['command']

interface RichTextEditorProps {
  initialHtml: string
  placeholder: string
  disabled: boolean
  onChange: (html: string) => void
}

/**
 * A minimal rich text editor over contentEditable. Bold/italic/underline/
 * strikethrough use execCommand (deprecated but universally supported and
 * undoable with Ctrl+Z); size and color wrap the selection in a styled span.
 */
export function RichTextEditor({
  initialHtml,
  placeholder,
  disabled,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [openMenu, setOpenMenu] = useState<'size' | 'color' | null>(null)
  const [activeFormats, setActiveFormats] = useState<Record<ToggleCommand, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  })
  const [currentSize, setCurrentSize] = useState('')
  const [currentColor, setCurrentColor] = useState('')

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.innerHTML = initialHtml
    updateEmptyMarker(editor)
    // Initial content is only read on mount; the editor is uncontrolled after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshToolbarState = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !editor.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      return
    }
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    })

    // Read the inline size/color the caret currently sits in.
    const anchor = selection.anchorNode
    let element = anchor instanceof Element ? anchor : anchor?.parentElement
    let size = ''
    let color = ''
    while (element && element !== editor) {
      if (element instanceof HTMLElement) {
        if (!size && element.style.fontSize) size = element.style.fontSize
        if (!color && element.style.color) color = element.style.color
      }
      element = element.parentElement
    }
    // Pinned base values (used to reset inside styled spans) read as default.
    setCurrentSize(size === '1.1rem' ? '' : size)
    setCurrentColor(color === 'var(--ink)' ? '' : color)
  }, [])

  // Keep the toolbar in sync with wherever the caret moves.
  useEffect(() => {
    document.addEventListener('selectionchange', refreshToolbarState)
    return () => document.removeEventListener('selectionchange', refreshToolbarState)
  }, [refreshToolbarState])

  // Close any open menu when clicking outside the toolbar.
  useEffect(() => {
    function onDocumentMouseDown(event: globalThis.MouseEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [])

  function updateEmptyMarker(editor: HTMLDivElement) {
    // Zero-width spaces (pending-style carriers) don't count as content.
    const text = (editor.textContent ?? '').replace(/\u200B/g, '')
    editor.setAttribute('data-empty', text.trim() === '' ? 'true' : 'false')
  }

  function emit() {
    const editor = editorRef.current
    if (!editor) return
    updateEmptyMarker(editor)
    onChange(editor.innerHTML)
  }

  function exec(command: ToggleCommand) {
    editorRef.current?.focus()
    document.execCommand(command)
    refreshToolbarState()
    emit()
  }

  function currentRange(): Range | null {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    const editor = editorRef.current
    if (!editor || !editor.contains(range.commonAncestorContainer)) return null
    return range
  }

  function applySpanStyle(prop: 'fontSize' | 'color', value: string) {
    setOpenMenu(null)
    const range = currentRange()
    if (!range) return

    // Resetting ("Normal" / "Auto") inside an already-styled span:
    // a plain wrapper would still inherit the ancestor's style, so pin
    // the base value explicitly instead.
    let effectiveValue = value
    if (!value) {
      const resetValue = prop === 'fontSize' ? '1.1rem' : 'var(--ink)'
      let element =
        range.commonAncestorContainer instanceof Element
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement
      while (element && element !== editorRef.current) {
        if (element instanceof HTMLElement && element.style[prop]) {
          effectiveValue = resetValue
          break
        }
        element = element.parentElement
      }
    }

    // No selection, just a caret: insert an (invisible) styled span at
    // the caret so the style applies to whatever is typed next.
    if (range.collapsed) {
      const span = document.createElement('span')
      if (effectiveValue) span.style[prop] = effectiveValue
      span.appendChild(document.createTextNode('\u200B'))
      range.insertNode(span)

      const selection = window.getSelection()
      if (selection && span.firstChild) {
        selection.removeAllRanges()
        const caret = document.createRange()
        caret.setStart(span.firstChild, 1)
        caret.collapse(true)
        selection.addRange(caret)
      }
      refreshToolbarState()
      emit()
      return
    }

    const fragment = range.extractContents()
    // Replace, don't nest: strip the same property from anything inside
    // the selection so the new value actually takes effect.
    fragment.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.style[prop]) {
        el.style[prop] = ''
        if (!el.getAttribute('style')) el.removeAttribute('style')
      }
    })

    const span = document.createElement('span')
    if (effectiveValue) span.style[prop] = effectiveValue
    span.appendChild(fragment)
    range.insertNode(span)

    // Keep the styled text selected so styles can be stacked.
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      selection.addRange(newRange)
    }
    refreshToolbarState()
    emit()
  }

  // Backspace with no real text inside a pending-style span cancels the
  // pending size/color instead of deleting further back.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Formatting shortcuts (Ctrl/Cmd+B/I/U) toggle without moving the
    // selection, so sync the toolbar right after the browser applies them.
    if (
      (event.ctrlKey || event.metaKey) &&
      ['b', 'i', 'u'].includes(event.key.toLowerCase())
    ) {
      requestAnimationFrame(refreshToolbarState)
      return
    }

    if (event.key !== 'Backspace') return
    const selection = window.getSelection()
    const editor = editorRef.current
    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !selection.getRangeAt(0).collapsed
    ) {
      return
    }

    const anchor = selection.anchorNode
    let element = anchor instanceof Element ? anchor : anchor?.parentElement
    while (element && element !== editor) {
      const isEmptyStyledSpan =
        element instanceof HTMLElement &&
        (element.style.fontSize || element.style.color) &&
        (element.textContent ?? '').replace(/\u200B/g, '') === ''
      if (isEmptyStyledSpan) {
        event.preventDefault()
        const previous = element.previousSibling
        const parent = element.parentNode
        element.remove()

        const caret = document.createRange()
        if (previous) {
          caret.setStartAfter(previous)
        } else if (parent) {
          caret.setStart(parent, 0)
        }
        caret.collapse(true)
        selection.removeAllRanges()
        selection.addRange(caret)

        refreshToolbarState()
        emit()
        return
      }
      element = element.parentElement
    }
  }

  // Paste as plain text only — no images, files, or foreign markup.
  // (Photos belong in the attach row, not inline in the entry.)
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    if (text) document.execCommand('insertText', false, text)
    emit()
  }

  // Same rule for drag-and-drop.
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  // Keep the editor's selection alive when toolbar controls are pressed.
  function keepSelection(event: MouseEvent) {
    event.preventDefault()
  }

  const currentSizeLabel =
    FONT_SIZES.find((size) => size.value === currentSize)?.label ?? 'Normal'

  return (
    <div className="rich-editor-wrap">
      <div className="editor-toolbar" ref={toolbarRef} onMouseDown={keepSelection}>
        {TOGGLE_COMMANDS.map(({ command, label, style, name }) => (
          <button
            key={command}
            type="button"
            className={`format-button${activeFormats[command] ? ' is-active' : ''}`}
            onClick={() => exec(command)}
            disabled={disabled}
            aria-label={name}
            aria-pressed={activeFormats[command]}
            title={name}
          >
            <span style={style}>{label}</span>
          </button>
        ))}

        <div className="format-dropdown">
          <button
            type="button"
            className="format-trigger"
            onClick={() => setOpenMenu(openMenu === 'size' ? null : 'size')}
            disabled={disabled}
            aria-expanded={openMenu === 'size'}
            aria-label="Text size"
            title="Text size"
          >
            {currentSizeLabel}
            <span className="format-trigger-chevron" aria-hidden="true">
              <ChevronDownIcon size={12} />
            </span>
          </button>
          {openMenu === 'size' && (
            <div className="format-menu" role="menu">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  role="menuitem"
                  className={`format-menu-item${
                    size.label === currentSizeLabel ? ' is-active' : ''
                  }`}
                  style={size.value ? { fontSize: `min(${size.value}, 1.2rem)` } : undefined}
                  onClick={() => applySpanStyle('fontSize', size.value)}
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="format-dropdown">
          <button
            type="button"
            className="format-trigger"
            onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
            disabled={disabled}
            aria-expanded={openMenu === 'color'}
            aria-label="Text color"
            title="Text color"
          >
            <span
              className="color-trigger-letter"
              style={{ borderBottomColor: currentColor || 'var(--ink)' }}
            >
              A
            </span>
            <span className="format-trigger-chevron" aria-hidden="true">
              <ChevronDownIcon size={12} />
            </span>
          </button>
          {openMenu === 'color' && (
            <div className="format-menu color-menu" role="menu">
              <div className="color-basics-row">
                <button
                  type="button"
                  role="menuitem"
                  className={`color-swatch color-swatch-auto${
                    currentColor ? '' : ' is-active'
                  }`}
                  onClick={() => applySpanStyle('color', '')}
                  aria-label="Automatic (black or white with the theme)"
                  title="Automatic — follows the theme"
                />
                {BASIC_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    role="menuitem"
                    className="color-swatch"
                    style={{ background: color.value }}
                    onClick={() => applySpanStyle('color', color.value)}
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="color-swatch-grid">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    role="menuitem"
                    className="color-swatch"
                    style={{ background: color.value }}
                    onClick={() => applySpanStyle('color', color.value)}
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        className="entry-content-input rich-editor"
        contentEditable={!disabled}
        data-placeholder={placeholder}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onDrop={handleDrop}
        role="textbox"
        aria-multiline="true"
        aria-label="Diary entry"
        suppressContentEditableWarning
      />
    </div>
  )
}
