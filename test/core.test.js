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
