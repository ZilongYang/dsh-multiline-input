import assert from 'node:assert/strict'
import test from 'node:test'
import { loadClientModule } from './harness.js'

const client = loadClientModule()
const t = client.__test

/** A localStorage-shaped stub; `throws` simulates a blocked backend. */
function storageStub(initial, { throws = false } = {}) {
  const values = new Map(Object.entries(initial ?? {}))
  return {
    values,
    getItem(key) {
      if (throws) throw new Error('blocked')
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      if (throws) throw new Error('blocked')
      values.set(key, value)
    },
  }
}

/** Base inputs for shouldIntercept: multi-line, plain draft, no modifiers. */
function interceptInput(overrides = {}) {
  return {
    mode: 'multi',
    key: 'Enter',
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 13,
    inComposer: true,
    editable: true,
    phase: 'plain',
    menuOpen: false,
    ...overrides,
  }
}

test('module exports the cordis face and test internals', () => {
  assert.equal(typeof client.apply, 'function')
  assert.deepEqual(client.inject, ['slots', 'locale'])
  assert.equal(typeof t.shouldIntercept, 'function')
})

test('normalizeMode only accepts the two known modes', () => {
  assert.equal(t.normalizeMode('multi'), 'multi')
  assert.equal(t.normalizeMode('single'), 'single')
  assert.equal(t.normalizeMode(undefined), 'single')
  assert.equal(t.normalizeMode(null), 'single')
  assert.equal(t.normalizeMode('MULTI'), 'single')
  assert.equal(t.normalizeMode(''), 'single')
})

test('nextMode cycles between single and multi', () => {
  assert.equal(t.nextMode('single'), 'multi')
  assert.equal(t.nextMode('multi'), 'single')
  // An unknown value is normalized first, so the first toggle turns multi on.
  assert.equal(t.nextMode('broken'), 'multi')
})

test('readMode reads the persisted mode and degrades safely', () => {
  assert.equal(t.readMode(storageStub({ [t.MODE_STORAGE_KEY]: 'multi' })), 'multi')
  assert.equal(t.readMode(storageStub({ [t.MODE_STORAGE_KEY]: 'single' })), 'single')
  assert.equal(t.readMode(storageStub({ [t.MODE_STORAGE_KEY]: 'garbage' })), 'single')
  assert.equal(t.readMode(storageStub({}, { throws: true })), 'single')
  assert.equal(t.readMode(undefined), 'single')
})

test('writeMode persists the normalized mode and swallows storage failures', () => {
  const store = storageStub()
  t.writeMode(store, 'multi')
  assert.equal(store.values.get(t.MODE_STORAGE_KEY), 'multi')
  t.writeMode(store, 'unknown')
  assert.equal(store.values.get(t.MODE_STORAGE_KEY), 'single')
  assert.doesNotThrow(() => t.writeMode(storageStub({}, { throws: true }), 'multi'))
  assert.doesNotThrow(() => t.writeMode(undefined, 'multi'))
})

test('applyModeAttribute writes and clears the document marker', () => {
  const calls = []
  const element = {
    setAttribute(name, value) {
      calls.push(['set', name, value])
    },
    removeAttribute(name) {
      calls.push(['remove', name])
    },
  }
  t.applyModeAttribute(element, 'multi')
  t.applyModeAttribute(element, 'single')
  assert.deepEqual(calls, [
    ['set', 'data-dsh-multiline-input', 'multi'],
    ['remove', 'data-dsh-multiline-input'],
  ])
  assert.doesNotThrow(() => t.applyModeAttribute(null, 'multi'))
})

test('formatShortcut renders user-facing key labels', () => {
  assert.equal(t.formatShortcut({ code: 'KeyE', modifiers: ['primary'] }, 'macos'), 'Cmd+E')
  assert.equal(t.formatShortcut({ code: 'KeyE', modifiers: ['primary'] }, 'windows'), 'Ctrl+E')
  assert.equal(t.formatShortcut({ code: 'KeyE', modifiers: ['control'] }, 'macos'), 'Ctrl+E')
  assert.equal(t.formatShortcut({ code: 'KeyE', modifiers: ['meta', 'shift'] }, 'macos'), 'Cmd+Shift+E')
  assert.equal(t.formatShortcut({ code: 'KeyE', modifiers: ['primary', 'shift'] }, 'windows'), 'Ctrl+Shift+E')
  assert.equal(t.formatShortcut({ code: 'Digit1', modifiers: [] }, 'linux'), '1')
  assert.equal(t.formatShortcut(null, 'macos'), null)
  assert.equal(t.formatShortcut(undefined, 'macos'), null)
  assert.equal(t.formatShortcut({ code: '', modifiers: [] }, 'macos'), null)
})

test('labelFromCatalog follows the effective binding, including unbound', () => {
  const rows = [
    { id: 'other.command', binding: { code: 'KeyQ', modifiers: ['control'] } },
    { id: t.COMMAND_ID, binding: { code: 'KeyE', modifiers: ['control'] } },
  ]
  assert.equal(t.labelFromCatalog(rows, 'macos'), 'Ctrl+E')
  assert.equal(t.labelFromCatalog([{ id: t.COMMAND_ID, binding: null }], 'macos'), null)
  assert.equal(t.labelFromCatalog([], 'macos'), null)
  assert.equal(t.labelFromCatalog(undefined, 'macos'), null)
})

test('default bindings: desktop Primary+E (Cmd/Ctrl), Web Primary+Shift+E, no Linux Web', () => {
  for (const platform of ['macos', 'windows', 'linux']) {
    assert.deepEqual(t.DEFAULTS[`desktop:${platform}`], { code: 'KeyE', modifiers: ['primary'] })
  }
  for (const platform of ['macos', 'windows']) {
    assert.deepEqual(t.DEFAULTS[`web:${platform}`], { code: 'KeyE', modifiers: ['primary', 'shift'] })
  }
  assert.equal(t.DEFAULTS['web:linux'], undefined)
  assert.equal(t.COMMAND_ID, 'multiline-input.toggle')
})

test('shouldIntercept: multi-line Enter becomes a newline, Shift+Enter submits', () => {
  assert.equal(t.shouldIntercept(interceptInput()), 'newline')
  assert.equal(t.shouldIntercept(interceptInput({ shiftKey: true })), 'submit')
})

test('shouldIntercept passes everything that is not the multi-line Enter gesture', () => {
  assert.equal(t.shouldIntercept(interceptInput({ mode: 'single' })), null)
  assert.equal(t.shouldIntercept(interceptInput({ key: 'a' })), null)
  assert.equal(t.shouldIntercept(interceptInput({ ctrlKey: true })), null)
  assert.equal(t.shouldIntercept(interceptInput({ metaKey: true })), null)
  assert.equal(t.shouldIntercept(interceptInput({ altKey: true })), null)
  assert.equal(t.shouldIntercept(interceptInput({ isComposing: true })), null)
  assert.equal(t.shouldIntercept(interceptInput({ keyCode: 229 })), null)
  assert.equal(t.shouldIntercept(interceptInput({ inComposer: false })), null)
  assert.equal(t.shouldIntercept(interceptInput({ editable: false })), null)
  assert.equal(t.shouldIntercept(interceptInput({ phase: 'claimed' })), null)
  assert.equal(t.shouldIntercept(interceptInput({ phase: 'submitting' })), null)
  assert.equal(t.shouldIntercept(interceptInput({ menuOpen: true })), null)
})

test('the newline floor matches the 3-5 line requirement', () => {
  assert.equal(t.MIN_LINES, 4)
  assert.equal(t.MODE_ATTRIBUTE, 'data-dsh-multiline-input')
  assert.equal(t.MODE_STORAGE_KEY, 'dsh-multiline-input.mode.v1')
})

test('the hint rides the composer dock stack, not the floating overlay seat', () => {
  // The overlay seat paints above the card and used to cover the goal bar /
  // todo / queue strips (and swallow their buttons). The dock stack is in
  // flow, so the hint row reserves the tab's 24px and nothing can be covered.
  assert.equal(t.HINT_SLOT, 'conversation.input.dock')
  assert.equal(t.HINT_ID, 'ml-input-hint')
  // Shipped dock orders: todo 0, cost strip 5, goal 10, queue 20. A higher
  // order keeps the tab last, flush on the card's top shoulder.
  assert.ok(t.HINT_ORDER > 20, `HINT_ORDER ${t.HINT_ORDER} must sort after the shipped dock rows`)
})

test('hint posture persists per device and degrades safely', () => {
  const store = storageStub()
  assert.equal(t.normalizeCollapsed('collapsed'), 'collapsed')
  assert.equal(t.normalizeCollapsed('expanded'), 'expanded')
  assert.equal(t.normalizeCollapsed('garbage'), 'expanded')
  assert.equal(t.isCollapsed('collapsed'), true)
  assert.equal(t.isCollapsed('expanded'), false)
  assert.equal(t.readCollapsed(store), 'expanded')
  t.writeCollapsed(store, 'collapsed')
  assert.equal(store.values.get(t.HINT_STORAGE_KEY), 'collapsed')
  assert.equal(t.readCollapsed(store), 'collapsed')
  assert.equal(t.readCollapsed(storageStub({}, { throws: true })), 'expanded')
  assert.equal(t.readCollapsed(undefined), 'expanded')
  assert.doesNotThrow(() => t.writeCollapsed(storageStub({}, { throws: true }), 'collapsed'))
})

test('sanitizeHistory tolerates the legacy array and damaged documents', () => {
  assert.deepEqual(t.sanitizeHistory(null), [])
  assert.deepEqual(t.sanitizeHistory('not json'), [])
  assert.deepEqual(t.sanitizeHistory({ version: 1, entries: 'nope' }), [])
  assert.deepEqual(t.sanitizeHistory([{ text: '  one  ', at: 1 }, { text: '' }, { nope: 1 }]), [{ text: 'one', at: 1 }])
  assert.deepEqual(t.sanitizeHistory(JSON.stringify({ version: 1, entries: [{ text: 'two', at: 2 }] })), [{ text: 'two', at: 2 }])
  // Duplicate texts collapse to the first occurrence.
  assert.deepEqual(t.sanitizeHistory([{ text: 'a' }, { text: 'a' }]), [{ text: 'a', at: 0 }])
})

test('recordHistory skips commands/empties and moves a repeat to the head', () => {
  const limits = { entries: 3, totalChars: 100, entryChars: 20 }
  let list = []
  list = t.recordHistory(list, '  hello  ', 1, limits)
  list = t.recordHistory(list, '   ', 2, limits)
  list = t.recordHistory(list, '/help', 3, limits)
  list = t.recordHistory(list, 'x'.repeat(21), 4, limits)
  assert.deepEqual(list.map(entry => entry.text), ['hello'])
  list = t.recordHistory(list, 'second', 5, limits)
  list = t.recordHistory(list, 'third', 6, limits)
  list = t.recordHistory(list, 'fourth', 7, limits)
  assert.deepEqual(list.map(entry => entry.text), ['fourth', 'third', 'second'])
  list = t.recordHistory(list, 'second', 8, limits)
  assert.deepEqual(list.map(entry => entry.text), ['second', 'fourth', 'third'])
  assert.equal(t.recordHistory(list, 'hello', 9, { ...limits, totalChars: 4 }).some(entry => entry.text === 'hello'), false)
})

test('repeating the newest submission keeps exactly one entry', () => {
  let list = t.recordHistory([], 'same text', 1, { entries: 10, totalChars: 100, entryChars: 50 })
  const first = list
  list = t.recordHistory(list, 'same text', 2, { entries: 10, totalChars: 100, entryChars: 50 })
  assert.equal(list, first)
  assert.equal(list.length, 1)
  list = t.recordHistory(list, 'older', 3, { entries: 10, totalChars: 100, entryChars: 50 })
  list = t.recordHistory(list, 'same text', 4, { entries: 10, totalChars: 100, entryChars: 50 })
  assert.deepEqual(list.map(entry => entry.text), ['same text', 'older'])
  assert.equal(list.length, 2)
})

test('readHistory/writeHistory round-trip and swallow storage failures', () => {
  const store = storageStub()
  t.writeHistory(store, [{ text: 'kept', at: 1 }])
  assert.deepEqual(t.readHistory(store), [{ text: 'kept', at: 1 }])
  assert.deepEqual(t.readHistory(storageStub({ [t.HISTORY_STORAGE_KEY]: 'broken' })), [])
  assert.deepEqual(t.readHistory(storageStub({}, { throws: true })), [])
  assert.deepEqual(t.readHistory(undefined), [])
  assert.doesNotThrow(() => t.writeHistory(storageStub({}, { throws: true }), [{ text: 'x', at: 1 }]))
})

test('advanceCapture records only an accepted sending draft', () => {
  let state = { text: null }
  let step = t.advanceCapture(state, { phase: 'plain', draft: 'old', newPending: false })
  state = step.state
  assert.equal(state.text, null)
  step = t.advanceCapture(state, { phase: 'sending', draft: 'hello', newPending: false })
  state = step.state
  assert.equal(state.text, 'hello')
  assert.equal(step.commit, null)
  // A new pending submission means the Host accepted it.
  step = t.advanceCapture(state, { phase: 'plain', draft: '', newPending: true })
  assert.equal(step.commit, 'hello')
  assert.equal(step.state.text, null)
  // Failed sends return to editing; a later sending replaces the stale capture.
  state = t.advanceCapture({ text: null }, { phase: 'sending', draft: 'failed', newPending: false }).state
  step = t.advanceCapture(state, { phase: 'plain', draft: 'failed', newPending: false })
  assert.equal(step.commit, null)
  assert.equal(step.state.text, 'failed')
  state = t.advanceCapture(step.state, { phase: 'sending', draft: 'ok', newPending: false }).state
  assert.equal(state.text, 'ok')
})

test('resolveBrowseIntent only takes the mode-specific history chord', () => {
  const base = {
    mode: 'single', key: 'ArrowUp', shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    isComposing: false, keyCode: 38, phase: 'plain', menuOpen: false, inComposer: true, browsing: false,
  }
  assert.equal(t.resolveBrowseIntent(base), 'older')
  assert.equal(t.resolveBrowseIntent({ ...base, key: 'ArrowDown' }), null)
  assert.equal(t.resolveBrowseIntent({ ...base, key: 'ArrowDown', browsing: true }), 'newer')
  assert.equal(t.resolveBrowseIntent({ ...base, key: 'Escape' }), null)
  assert.equal(t.resolveBrowseIntent({ ...base, key: 'Escape', browsing: true }), 'exit')
  assert.equal(t.resolveBrowseIntent({ ...base, shiftKey: true }), null)
  assert.equal(t.resolveBrowseIntent({ ...base, mode: 'multi' }), null)
  assert.equal(t.resolveBrowseIntent({ ...base, mode: 'multi', shiftKey: true }), 'older')
  assert.equal(t.resolveBrowseIntent({ ...base, mode: 'multi', shiftKey: true, key: 'ArrowDown', browsing: true }), 'newer')
  for (const override of [
    { ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: 229 },
    { phase: 'sending' }, { phase: 'claimed' }, { menuOpen: true }, { inComposer: false }, { key: 'a' },
  ]) assert.equal(t.resolveBrowseIntent({ ...base, ...override }), null, JSON.stringify(override))
})

test('nextBrowseIndex wraps in both directions', () => {
  assert.equal(t.nextBrowseIndex(0, 5, 'older'), 1)
  assert.equal(t.nextBrowseIndex(4, 5, 'older'), 0)
  assert.equal(t.nextBrowseIndex(2, 5, 'newer'), 1)
  assert.equal(t.nextBrowseIndex(0, 5, 'newer'), 4)
  assert.equal(t.nextBrowseIndex(0, 0, 'older'), 0)
})

test('the rc.5 sending phase is never intercepted', () => {
  assert.equal(t.shouldIntercept(interceptInput({ phase: 'sending' })), null)
  assert.equal(t.shouldIntercept(interceptInput({ phase: 'sending', shiftKey: true })), null)
})

test('0.2.0 storage keys, limits, and the clear-history command are stable', () => {
  assert.equal(t.HINT_STORAGE_KEY, 'dsh-multiline-input.hint.v1')
  assert.equal(t.HISTORY_STORAGE_KEY, 'dsh-multiline-input.history.v1')
  assert.equal(t.CLEAR_HISTORY_COMMAND_ID, 'multiline-input.clear-history')
  assert.equal(t.HISTORY_MAX_ENTRIES, 200)
  assert.equal(t.HISTORY_MAX_TOTAL_CHARS, 100000)
  assert.equal(t.HISTORY_MAX_ENTRY_CHARS, 16000)
})

test('advanceCapture ignores a pending echo with no captured draft', () => {
  const step = t.advanceCapture({ text: null }, { phase: 'plain', draft: '', newPending: true })
  assert.equal(step.commit, null)
  assert.equal(step.state.text, null)
  assert.deepEqual(t.trimHistory([{ text: 'a' }, { text: 'b' }], { entries: 1, totalChars: 100, entryChars: 10 }).map(e => e.text), ['a'])
})

test('advanceCapture can commit one accepted draft and capture the next in one step', () => {
  const step = t.advanceCapture({ text: 'first' }, { phase: 'sending', draft: 'second', newPending: true })
  assert.equal(step.commit, 'first')
  assert.equal(step.state.text, 'second')
})

test('MultiLineHint renders expanded, collapsed, and browsing states', () => {
  const store = (value) => ({ getSnapshot: () => value, subscribe: () => () => {} })
  const props = {
    t: (key, params) => (params === undefined ? key : `${key} ${JSON.stringify(params)}`),
    modeStore: store('single'),
    shortcutStore: store('Cmd+E'),
    toggle: () => {},
    useInput: (selector) => selector({ phase: 'plain', draft: '' }),
    useSession: (selector) => selector({ pendingSubmissions: [] }),
    inputActions: { setDraft: () => {}, persistDraft: () => {} },
  }
  t.setCollapsed(false)
  const expanded = t.MultiLineHint(props)
  assert.equal(expanded.props.className, 'dmi-hint-row')
  const tab = expanded.children[0]
  assert.equal(tab.props.className, 'dmi-hint')
  // The mode button, the separator, the key, and the collapse control.
  assert.equal(tab.children.length, 2)
  assert.equal(tab.children[1].props.className, 'dmi-hint-collapse')

  t.setCollapsed(true)
  const collapsed = t.MultiLineHint(props)
  assert.equal(collapsed.props.className, 'dmi-hint-row dmi-hint-row-collapsed')
  const line = collapsed.children[0]
  assert.equal(line.props.className, 'dmi-hint-line')
  assert.deepEqual(line.children.map(child => child.props.className), ['dmi-hint-seam', 'dmi-hint-chevron'])
  t.setCollapsed(false)
})

test('MultiLineHint shows the history position while browsing', () => {
  const store = (value) => ({ getSnapshot: () => value, subscribe: () => () => {} })
  t.recordHistoryEntry('the only entry')
  const browsing = { active: true, index: 0, saved: '' }
  t.browseStore.set(browsing)
  const tree = t.MultiLineHint({
    t: (key, params) => (params === undefined ? key : `${key} ${JSON.stringify(params)}`),
    modeStore: store('single'),
    shortcutStore: store('Cmd+E'),
    toggle: () => {},
    useInput: (selector) => selector({ phase: 'plain', draft: 'the only entry' }),
    useSession: (selector) => selector({ pendingSubmissions: [] }),
    inputActions: { setDraft: () => {}, persistDraft: () => {} },
  })
  const main = tree.children[0].children[0]
  assert.equal(main.props.title, 'historyTitle')
  const label = main.children[main.children.length - 1]
  assert.match(label.children[0], /^historyPosition/)
  t.browseStore.set({ active: false, index: 0, saved: '' })
})

test('cleanHistoryText rejects commands, empties, and oversized drafts', () => {
  assert.equal(t.cleanHistoryText('  hi  '), 'hi')
  assert.equal(t.cleanHistoryText('   '), null)
  assert.equal(t.cleanHistoryText('/help'), null)
  assert.equal(t.cleanHistoryText('x'.repeat(t.HISTORY_MAX_ENTRY_CHARS + 1)), null)
})

test('the Plugins page configuration renders the summary and sections', () => {
  const store = (value) => ({ getSnapshot: () => value, subscribe: () => () => {} })
  const translate = (key, params) => (params === undefined ? key : `${key} ${JSON.stringify(params)}`)
  const props = {
    t: translate,
    historyStore: store([{ text: 'a', at: 1 }]),
    hintStore: store('expanded'),
    shortcutStore: store('Cmd+E'),
    linesStore: store(4),
    defaultModeStore: store('single'),
    sessionMemoryStore: store(false),
    clearHistory: () => {},
    setCollapsed: () => {},
    setLines: () => {},
    setDefaultMode: () => {},
    setSessionMemory: () => {},
    clearSessions: () => {},
  }
  assert.equal(t.MultiLineSettings({ ...props, view: 'summary' }), 'settingsSummary')
  const tree = t.MultiLineSettingsBody(props)
  assert.equal(tree.props.className, 'dmi-settings')
  const section = t.MultiLineSettingsSection(props)
  assert.equal(section.type(section.props).props.className, 'dmi-settings')
  assert.equal(t.SETTINGS_SECTION_SLOT, 'settings.section')
  assert.equal(t.SETTINGS_SECTION_ID, 'multiline-input')
  assert.ok(t.SETTINGS_SECTION_ORDER > 20)
  // shortcut, starting lines, default mode, per-session memory, history, hint
  assert.equal(tree.children.length, 6)
  assert.equal(tree.children[0].props.className, 'dmi-settings-section')
  assert.equal(tree.children[0].children[0].children[0].props.className, 'dmi-settings-title')
  // The floor and the default mode are segmented choices; the selected one is marked.
  const lines = tree.children[1]
  assert.equal(lines.children[0].children[0].children[0], 'settingsLines')
  const choices = lines.children[2]
  assert.equal(choices.props.className, 'dmi-settings-choices')
  const choiceItems = choices.children.flat()
  assert.equal(choiceItems.length, 3)
  assert.deepEqual(choiceItems.map((item) => item.props['aria-pressed']), [false, true, false])
  assert.match(choiceItems[1].props.className, /dmi-settings-choice-active/)
  const mode = tree.children[2]
  assert.equal(mode.children[0].children[0].children[0], 'settingsMode')
  assert.equal(mode.children[2].children[0].props['aria-pressed'], true)
  assert.equal(mode.children[2].children[1].props['aria-pressed'], false)
  // Per-session memory is a switch, off by default; the clear action only shows when on.
  const session = tree.children[3]
  assert.equal(session.children[0].children[0].children[0], 'settingsSession')
  const toggle = session.children[2]
  assert.equal(toggle.props.role, 'switch')
  assert.equal(toggle.props['aria-checked'], false)
  assert.equal(toggle.props.className, 'dmi-switch')
  assert.equal(toggle.children.length, 2)
  assert.equal(toggle.children[0].props.className, 'dmi-switch-track')
  assert.equal(toggle.children[1].children[0], 'settingsSessionOff')
  assert.equal(session.children[3], false)
  // With the switch off the mode section explains the shared scope instead.
  assert.equal(mode.children[1].children[0], 'settingsModeDescriptionGlobal')
  assert.equal(t.SETTINGS_SLOT, 'plugins.row.config')
  assert.equal(t.SETTINGS_KEY, 'dsh-multiline-input#multiline-input')
  assert.equal(t.openSettingsPanel(), false)
})

test('the multi-line floor covers the read-only submit phases', () => {
  // DSH 0.2.2 keeps the editor `contenteditable="false"` while an ordinary
  // message waits for the Host (`phase: 'sending'`), so a contenteditable-only
  // selector would drop the floor and collapse the composer on every send.
  assert.match(t.FLOOR_SELECTOR, /\[contenteditable="true"\]/)
  assert.match(t.FLOOR_SELECTOR, /\[data-phase\]:not\(\[data-phase="plain"\]\)/)
  assert.match(t.FLOOR_SELECTOR, /\[data-composer-card\]/)
  assert.match(t.FLOOR_SELECTOR, /\[data-composer-input\]/)
  // The main rule and the `@supports not (height: 1lh)` fallback both carry it.
  const occurrences = t.CSS.split(t.FLOOR_SELECTOR).length - 1
  assert.equal(occurrences, 2)
  assert.match(t.CSS, /min-height: calc\(var\(--dmi-min-lines, 4\) \* 1lh \+ 8px\);/)
  assert.match(t.CSS, /min-height: calc\(var\(--dmi-min-lines, 4\) \* 24px \+ 8px\);/)
  // The old contenteditable-only floor selector is gone.
  assert.doesNotMatch(t.CSS, /\[data-composer-input\]\[contenteditable="true"\] \{/)
})

test('the trigger menu is detected through both anchors', () => {
  // 0.2.2 marks the menu surface with `data-trigger-menu`; older hosts only
  // carry `role="listbox"` inside the composer overlay.
  assert.match(t.TRIGGER_MENU, /data-trigger-menu/)
  assert.match(t.TRIGGER_MENU, /role="listbox"/)
})

test('all eight locale packs share one key set with intact placeholders', () => {
  // DSH 0.2.2 ships de / en / es / fr / ja / pt / ru / zh; a missing pack falls
  // back to English, so every pack must be complete rather than partial.
  assert.deepEqual(Object.keys(t.DICT).sort(), ['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh'])
  const reference = Object.keys(t.DICT.en).sort()
  const placeholders = (text) => (text.match(/\{[a-z]+\}/g) ?? []).sort()
  for (const [name, dict] of Object.entries(t.DICT)) {
    assert.deepEqual(Object.keys(dict).sort(), reference, `${name} keys differ`)
    for (const [key, value] of Object.entries(dict)) {
      assert.equal(typeof value, 'string', `${name}.${key} is not a string`)
      assert.notEqual(value.trim(), '', `${name}.${key} is blank`)
    }
  }
  for (const key of ['settingsLinesOption', 'settingsCurrentKeys', 'settingsHistoryCount', 'historyPosition', 'ariaLabel']) {
    for (const [name, dict] of Object.entries(t.DICT)) {
      assert.deepEqual(placeholders(dict[key]), placeholders(t.DICT.en[key]), `${name}.${key} placeholders`)
    }
  }
})

test('the multi-line floor accepts exactly 3, 4, or 5 lines', () => {
  assert.deepEqual(t.MIN_LINES_VALUES, [3, 4, 5])
  assert.equal(t.normalizeLines(3), 3)
  assert.equal(t.normalizeLines('5'), 5)
  assert.equal(t.normalizeLines(4), 4)
  for (const value of [2, 6, 7, 0, -1, 3.5, 'abc', '', null, undefined, true]) {
    assert.equal(t.normalizeLines(value), t.MIN_LINES, `${String(value)} does not clamp to the default`)
  }
})

test('readLines/writeLines persist the floor and swallow storage failures', () => {
  const store = storageStub({})
  assert.equal(t.readLines(store), t.MIN_LINES)
  t.writeLines(store, 5)
  assert.equal(store.values.get(t.LINES_STORAGE_KEY), '5')
  assert.equal(t.readLines(store), 5)
  t.writeLines(store, 9)
  assert.equal(t.readLines(store), t.MIN_LINES)
  const blocked = storageStub({}, { throws: true })
  assert.equal(t.readLines(blocked), t.MIN_LINES)
  assert.doesNotThrow(() => t.writeLines(blocked, 3))
})

test('applyLines writes the custom property the CSS rule multiplies', () => {
  const written = {}
  const element = { style: { setProperty: (name, value) => { written[name] = value } } }
  t.applyLines(element, 5)
  assert.equal(written[t.LINES_PROPERTY], '5')
  t.applyLines(element, 9)
  assert.equal(written[t.LINES_PROPERTY], String(t.MIN_LINES))
  // Non-DOM hosts and element stubs without a style object stay silent.
  assert.doesNotThrow(() => t.applyLines(null, 5))
  assert.doesNotThrow(() => t.applyLines(undefined, 5))
  assert.doesNotThrow(() => t.applyLines({}, 5))
})

test('per-session modes remember one session each and trim the oldest', () => {
  let doc = t.emptySessionModes()
  assert.equal(doc.version, 1)
  assert.deepEqual(doc.sessions, [])
  assert.equal(t.sessionModeOf(doc, 's1'), null)

  doc = t.withSessionMode(doc, 's1', 'multi')
  doc = t.withSessionMode(doc, 's2', 'single')
  assert.equal(t.sessionModeOf(doc, 's1'), 'multi')
  assert.equal(t.sessionModeOf(doc, 's2'), 'single')
  assert.equal(t.sessionModeOf(doc, 's3'), null)

  // Re-writing a session keeps one entry and moves it to the most-recent end.
  doc = t.withSessionMode(doc, 's1', 'single')
  assert.deepEqual(doc.sessions.map((item) => item.id), ['s2', 's1'])
  assert.equal(t.sessionModeOf(doc, 's1'), 'single')

  // Blank ids and damaged documents never invent an entry.
  assert.deepEqual(t.withSessionMode(doc, '', 'multi'), doc)
  assert.deepEqual(t.withSessionMode(doc, undefined, 'multi'), doc)
  assert.deepEqual(t.sanitizeSessionModes({ version: 99, sessions: [{ id: 's1', mode: 'multi' }] }), t.emptySessionModes())
  assert.deepEqual(t.sanitizeSessionModes(null), t.emptySessionModes())
  assert.deepEqual(t.sanitizeSessionModes({ version: 1, sessions: 'nope' }), t.emptySessionModes())
  assert.deepEqual(
    t.sanitizeSessionModes({ version: 1, sessions: [{ id: 's1', mode: 'multi' }, { id: 's1', mode: 'single' }, { id: ' ', mode: 'multi' }, { id: 's2', mode: 'weird' }, null] }).sessions,
    [{ id: 's1', mode: 'multi' }],
  )

  // The LRU keeps the newest entries and drops the oldest first.
  let many = t.emptySessionModes()
  const total = t.SESSION_MODE_MAX_ENTRIES + 5
  for (let index = 0; index < total; index += 1) many = t.withSessionMode(many, `s${index}`, 'multi')
  assert.equal(many.sessions.length, t.SESSION_MODE_MAX_ENTRIES)
  assert.equal(t.sessionModeOf(many, 's0'), null)
  assert.equal(t.sessionModeOf(many, `s${total - 1}`), 'multi')
})

test('readSessionModes/writeSessionModes round-trip and degrade safely', () => {
  const store = storageStub({})
  assert.deepEqual(t.readSessionModes(store), t.emptySessionModes())
  t.writeSessionModes(store, t.withSessionMode(t.emptySessionModes(), 's1', 'multi'))
  assert.equal(t.readSessionModes(store).sessions.length, 1)
  assert.equal(t.sessionModeOf(t.readSessionModes(store), 's1'), 'multi')

  const blocked = storageStub({}, { throws: true })
  assert.deepEqual(t.readSessionModes(blocked), t.emptySessionModes())
  assert.doesNotThrow(() => t.writeSessionModes(blocked, t.emptySessionModes()))

  const damaged = storageStub({ [t.SESSION_MODE_STORAGE_KEY]: 'not json' })
  assert.deepEqual(t.readSessionModes(damaged), t.emptySessionModes())

  const legacy = storageStub({ [t.SESSION_MODE_STORAGE_KEY]: JSON.stringify({ version: 2, sessions: [] }) })
  assert.deepEqual(t.readSessionModes(legacy), t.emptySessionModes())
})

test('per-session memory is a switch that defaults to the shared mode', () => {
  // Off is the default: one device-wide mode, exactly like 0.2.1.
  const store = storageStub({})
  assert.equal(t.readSessionMemory(store), false)
  assert.equal(t.normalizeSessionMemory(undefined), false)
  assert.equal(t.normalizeSessionMemory('off'), false)
  assert.equal(t.normalizeSessionMemory('on'), true)
  assert.equal(t.normalizeSessionMemory('ON'), false)

  t.writeSessionMemory(store, true)
  assert.equal(store.values.get(t.SESSION_MEMORY_STORAGE_KEY), t.SESSION_MEMORY_ON)
  assert.equal(t.readSessionMemory(store), true)
  t.writeSessionMemory(store, false)
  assert.equal(store.values.get(t.SESSION_MEMORY_STORAGE_KEY), t.SESSION_MEMORY_OFF)
  assert.equal(t.readSessionMemory(store), false)

  const blocked = storageStub({}, { throws: true })
  assert.equal(t.readSessionMemory(blocked), false)
  assert.doesNotThrow(() => t.writeSessionMemory(blocked, true))
})

test('resolveSessionMode only consults overrides while the switch is on', () => {
  const doc = t.withSessionMode(t.withSessionMode(t.emptySessionModes(), 's1', 'multi'), 's2', 'single')
  // Off: every session follows the shared default.
  assert.equal(t.resolveSessionMode(doc, false, 's1', 'single'), 'single')
  assert.equal(t.resolveSessionMode(doc, false, 's2', 'multi'), 'multi')
  assert.equal(t.resolveSessionMode(doc, false, 's3', 'multi'), 'multi')
  // On: the session's own mode wins, unknown sessions fall back.
  assert.equal(t.resolveSessionMode(doc, true, 's1', 'single'), 'multi')
  assert.equal(t.resolveSessionMode(doc, true, 's2', 'multi'), 'single')
  assert.equal(t.resolveSessionMode(doc, true, 's3', 'single'), 'single')
  assert.equal(t.resolveSessionMode(doc, true, null, 'multi'), 'multi')
  // The fallback itself is normalized.
  assert.equal(t.resolveSessionMode(doc, false, 's1', 'nonsense'), 'single')
})
