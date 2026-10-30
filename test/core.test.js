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
