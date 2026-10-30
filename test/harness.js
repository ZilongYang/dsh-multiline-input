/**
 * Loads the hand-written client bundle inside Node for unit tests.
 *
 * `client.js` is a script, not an ES module: it registers a factory on
 * `window.__ModuleLoader__` and only touches the DOM inside `apply()` and the
 * rendered component. The harness provides the loader surface, a React stub
 * good enough for the factory body, and returns the module exports so tests
 * can reach the pure `__test` helpers.
 */
import { readFileSync } from 'node:fs'

/** React stub: the factory body only captures `createElement`. */
const reactStub = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  useRef: (initial) => ({ current: initial }),
  useState: (initial) => [initial, () => {}],
  useLayoutEffect: () => {},
  useEffect: () => {},
}

/**
 * Execute client.js and return its module exports.
 * @returns the object returned by the registered factory.
 */
export function loadClientModule() {
  let definition
  const fakeWindow = {
    __ModuleLoader__: {
      load(value) {
        definition = value
      },
    },
  }
  const fakeDocument = {
    documentElement: null,
    createElement: () => ({ setAttribute() {}, remove() {} }),
    head: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
  }
  const fakeNavigator = { platform: 'MacIntel' }
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  // eslint-disable-next-line no-new-func
  const run = new Function('window', 'document', 'navigator', source)
  run(fakeWindow, fakeDocument, fakeNavigator)
  if (definition === undefined) throw new Error('client.js did not register a module')
  return definition.factory((id) => {
    if (id === 'react') return reactStub
    throw new Error(`unexpected require: ${id}`)
  })
}
