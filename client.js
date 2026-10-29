/**
 * Client half of dsh-multiline-input.
 *
 * Single/multi-line composer toggle for the DSH Web GUI:
 *
 *   - a shortcut command (default Ctrl+E) registered through `ctx.shortcuts`,
 *     so the binding appears in Settings → General → Keyboard shortcuts and
 *     every edit there is validated and persisted by DSH itself;
 *   - a hint tab riding the composer card's top shoulder, rendered as its own
 *     row in the composer dock stack (`conversation.input.dock`): the row is in
 *     flow, so a dock card above the composer (goal bar, todos, queue, cost
 *     strip) can never be overlapped — the old floating overlay painted over
 *     them and swallowed their buttons;
 *   - a taller composer floor in multi-line mode, driven by
 *     `<html data-dsh-multiline-input="multi">` and one CSS rule;
 *   - Enter / Shift+Enter swapped in multi-line mode by re-dispatching the
 *     same keydown with the opposite `shiftKey`. DSH's own composer keymap
 *     keeps deciding newline vs submit, so undo history, the IME guard,
 *     busy-enter (queue / steer) and menu arbitration all stay intact.
 *
 * Hand-written bundle: the module loader materializes `factory(require)` and
 * takes its return value as the module exports. React comes from the browser
 * module table; no Harness Client package is imported.
 *
 * Reference contracts (source checkout, 0.2.1-rc.3):
 *   - packages/client/ui-conversation/src/client/skeleton/InputBar.tsx
 *   - packages/client/ui-conversation/src/client/skeleton/ConversationContent.tsx
 *     (composer stack: `conversation.input.dock` rows above the card)
 *   - packages/client/ui-conversation/src/client/skeleton/InputBar.module.css
 *     (`.root` side clearance, `.card` card-width cap)
 *   - packages/client/ui-conversation/src/client/input/editor/DraftEditor.tsx
 *   - packages/client/ui-conversation/src/client/input/editor/keymap.ts
 *   - packages/client/ui-conversation/src/client/contract/input.ts
 *   - packages/client/ui-conversation/src/client/contract/slots.ts
 *   - packages/extensions/cordis-client-runner/src/client/slot-catalog.ts
 *   - packages/client/shortcuts/src/client/types.ts
 *   - packages/client/modules/README.zh.md
 */
window.__ModuleLoader__.load({
  id: 'dsh-multiline-input',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace and the style element id (a reload must not stack styles). */
    const NS = 'dsh-multiline-input'
    const STYLE_ID = 'dsh-multiline-input-style'

    /** Device-local mode preference; the mode itself is not Session data. */
    const MODE_STORAGE_KEY = 'dsh-multiline-input.mode.v1'
    /** `<html>` marker read by the height rule. */
    const MODE_ATTRIBUTE = 'data-dsh-multiline-input'

    /** Shortcut command id; dotted form so DSH can persist user overrides. */
    const COMMAND_ID = 'multiline-input.toggle'
    /**
     * The hint lives in the composer dock stack — the in-flow rows directly
     * above the card (goal 10, queue 20, todos 0, cost strip 5). A high order
     * keeps the tab last, flush on the card's top shoulder.
     */
    const HINT_SLOT = 'conversation.input.dock'
    const HINT_ID = 'ml-input-hint'
    const HINT_ORDER = 1000
    /** Multi-line floor in text lines (the requested 3–5 range). */
    const MIN_LINES = 4

    const MODE_SINGLE = 'single'
    const MODE_MULTI = 'multi'

    /**
     * Default bindings. Desktop may bind any combination (the native keyboard
     * bridge outranks editors). Web only accepts the documented allowlist, so
     * it uses Primary+Shift+E; Linux Web has no allowed letter chord and stays
     * unbound until the user picks one in Settings.
     */
    const DEFAULTS = {
      'desktop:macos': { code: 'KeyE', modifiers: ['primary'] },
      'desktop:windows': { code: 'KeyE', modifiers: ['primary'] },
      'desktop:linux': { code: 'KeyE', modifiers: ['primary'] },
      'web:macos': { code: 'KeyE', modifiers: ['primary', 'shift'] },
      'web:windows': { code: 'KeyE', modifiers: ['primary', 'shift'] },
    }

    const DICT = {
      zh: {
        toMulti: '多行输入',
        toSingle: '单行输入',
        submitHint: 'Shift+Enter 提交',
        toggleLabel: '切换多行输入',
        hintTitle: '点击切换输入模式；快捷键可在「设置 → 通用 → 快捷键」中修改',
        ariaLabel: '{action}（{keys}）',
      },
      en: {
        toMulti: 'Multiline input',
        toSingle: 'Single-line input',
        submitHint: 'Shift+Enter to send',
        toggleLabel: 'Toggle multiline input',
        hintTitle: 'Click to switch the input mode. Edit the shortcut in Settings → General → Keyboard shortcuts.',
        ariaLabel: '{action} ({keys})',
      },
    }

    const CSS = `
/* The hint is its own row in the composer dock stack — the in-flow column of
   strips directly above the input card (goal bar, todos, queue, cost strip).
   Occupying real layout space is what makes the tab safe: the old version
   floated in \`conversation.input.overlay\` at \`bottom: 100%\`, painted over
   whatever DSH docked above the card and swallowed that strip's buttons. */
.dmi-hint-row {
  box-sizing: border-box;
  display: flex;
  justify-content: flex-end;
  /* The card's own column: InputBar's root pads by the shared side clearance
     and the card is capped at the shared card width, centered. The two
     declarations mirror that so the tab's right edge lands on the card's. */
  width: min(
    calc(100% - 2 * var(--dsh-composer-side-clearance, 16px)),
    var(--dsh-composer-card-max-width, 100%)
  );
  margin-inline: auto;
  /* The stack's row gap would detach the tab from the card's top edge;
     cancelling it keeps the "tab on the shoulder" seam. The live gap is read
     in \`MultiLineHint\` (6px docked, 8px in the hero composer) into
     \`--dmi-stack-gap\`; the fallbacks only cover the first frame. */
  margin-bottom: calc(-1 * var(--dmi-stack-gap, var(--dsh-composer-stack-gap, 6px)));
  padding-right: calc(var(--dsw-radius-panel, 16px) + 4px);
  pointer-events: none;
}
/* A small tab riding on the card's top shoulder: same fill as the card, so it
   reads as one piece, with the card's own hairline continuing under it. */
.dmi-hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  /* Hug the text: the tab and its hairline only span the hint. */
  width: max-content;
  max-width: 100%;
  height: 24px;
  padding: 0 12px;
  background: var(--dsw-specific-input-major);
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md) var(--dsw-radius-md) 0 0;
  pointer-events: none;
  white-space: nowrap;
}
.dmi-hint-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 1px 6px;
  border: 0;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  pointer-events: auto;
}
.dmi-hint-button:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dmi-hint-key {
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}
.dmi-hint-sep {
  color: var(--dsw-alias-label-caption);
  opacity: 0.6;
}
html[${MODE_ATTRIBUTE}="multi"] [data-composer-card] [data-composer-input][contenteditable="true"] {
  min-height: calc(${MIN_LINES} * 1lh + 8px);
}
@supports not (height: 1lh) {
  html[${MODE_ATTRIBUTE}="multi"] [data-composer-card] [data-composer-input][contenteditable="true"] {
    min-height: ${MIN_LINES * 24 + 8}px;
  }
}
@media (max-width: 720px) {
  .dmi-hint-sep,
  .dmi-hint-meta {
    display: none;
  }
}
`

    //#region Pure helpers (also exported for node --test)

    /**
     * Coerce any stored value into a known mode.
     * @param value - raw preference value.
     * @returns the normalized mode.
     */
    function normalizeMode(value) {
      return value === MODE_MULTI ? MODE_MULTI : MODE_SINGLE
    }

    /**
     * Cycle between the two modes.
     * @param mode - current mode.
     * @returns the other mode.
     */
    function nextMode(mode) {
      return normalizeMode(mode) === MODE_MULTI ? MODE_SINGLE : MODE_MULTI
    }

    /**
     * Read the persisted mode, treating unavailable storage as single-line.
     * @param store - `localStorage`-like object, or undefined.
     * @returns the stored mode or the default.
     */
    function readMode(store) {
      try {
        return normalizeMode(store?.getItem(MODE_STORAGE_KEY))
      } catch {
        return MODE_SINGLE
      }
    }

    /**
     * Persist one mode; a blocked storage backend only costs the preference.
     * @param store - `localStorage`-like object, or undefined.
     * @param mode - mode to persist.
     */
    function writeMode(store, mode) {
      try {
        store?.setItem(MODE_STORAGE_KEY, normalizeMode(mode))
      } catch {
        /* Preference persistence is best-effort. */
      }
    }

    /**
     * Project the mode onto the document root consumed by the height rule.
     * @param element - document root, or null in non-DOM tests.
     * @param mode - mode to apply.
     */
    function applyModeAttribute(element, mode) {
      if (element === null || element === undefined) return
      if (typeof element.setAttribute !== 'function' || typeof element.removeAttribute !== 'function') return
      if (normalizeMode(mode) === MODE_MULTI) element.setAttribute(MODE_ATTRIBUTE, MODE_MULTI)
      else element.removeAttribute(MODE_ATTRIBUTE)
    }

    const MODIFIER_LABELS = { control: 'Ctrl', meta: 'Cmd', alt: 'Alt', shift: 'Shift' }

    /**
     * Human label for one physical key code (`KeyE` → `E`, `Digit1` → `1`).
     * @param code - KeyboardEvent.code value.
     * @returns the key label, or an empty string.
     */
    function keyLabel(code) {
      if (typeof code !== 'string' || code === '') return ''
      return code.replace(/^Key/u, '').replace(/^Digit/u, '')
    }

    /**
     * Render a binding as `Ctrl+E` style text.
     * @param binding - `{ code, modifiers }` or null.
     * @param platform - `macos`, `windows`, or `linux`.
     * @returns the label, or null when there is no binding.
     */
    function formatShortcut(binding, platform) {
      if (binding === null || binding === undefined || typeof binding.code !== 'string') return null
      const modifiers = Array.isArray(binding.modifiers) ? binding.modifiers : []
      const labels = modifiers.map((modifier) => {
        if (modifier === 'primary') return platform === 'macos' ? 'Cmd' : 'Ctrl'
        return MODIFIER_LABELS[modifier] ?? modifier
      })
      const key = keyLabel(binding.code)
      if (key === '') return null
      return [...labels, key].join('+')
    }

    /**
     * Find this command in the DSH shortcut catalog and render its binding.
     * @param rows - `ctx.shortcuts.catalog` snapshot.
     * @param platform - `ctx.shortcuts.platform`.
     * @returns the label, or null when unbound / not registered yet.
     */
    function labelFromCatalog(rows, platform) {
      if (!Array.isArray(rows)) return null
      const row = rows.find((entry) => entry !== null && entry !== undefined && entry.id === COMMAND_ID)
      if (row === undefined) return null
      return formatShortcut(row.binding, platform)
    }

    /**
     * Decide whether the multi-line keymap should take over one keydown.
     * @param input - flattened event and composer facts.
     * @returns `newline` (Enter), `submit` (Shift+Enter), or null to pass.
     */
    function shouldIntercept(input) {
      const {
        mode, key, shiftKey, ctrlKey, metaKey, altKey,
        isComposing, keyCode, inComposer, editable, phase, menuOpen,
      } = input
      if (normalizeMode(mode) !== MODE_MULTI) return null
      if (key !== 'Enter') return null
      if (ctrlKey === true || metaKey === true || altKey === true) return null
      if (isComposing === true || keyCode === 229) return null
      if (inComposer !== true || editable !== true) return null
      if (phase !== 'plain') return null
      if (menuOpen === true) return null
      return shiftKey === true ? 'submit' : 'newline'
    }

    //#endregion

    //#region Stores and DOM helpers

    /**
     * Minimal snapshot store: one value, stable identity until it moves.
     * @param initial - first snapshot.
     * @returns a store consumable by `useSyncExternalStore`.
     */
    function createValueStore(initial) {
      let value = initial
      const listeners = new Set()
      return {
        getSnapshot: () => value,
        subscribe(listener) {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
        set(next) {
          if (Object.is(next, value)) return
          value = next
          for (const listener of [...listeners]) listener()
        },
      }
    }

    const COMPOSER_CARD = '[data-composer-card]'
    const COMPOSER_INPUT = '[data-composer-input]'
    const COMPOSER_OVERLAY = '[data-composer-overlay]'
    const TRIGGER_MENU = '[role="listbox"]'
    const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]'

    /** @returns the device `localStorage`, or undefined when blocked. */
    function localStore() {
      try {
        return window.localStorage
      } catch {
        return undefined
      }
    }

    /** @returns whether the page runs inside the Desktop shell. */
    function isDesktopShell() {
      try {
        return window.dshDesktop !== undefined
      } catch {
        return false
      }
    }

    /** @returns `macos`, `windows`, or `linux`, from the visiting device. */
    function osPlatform() {
      try {
        const platform = typeof navigator.userAgentData?.platform === 'string'
          ? navigator.userAgentData.platform
          : navigator.platform
        if (/mac/i.test(platform)) return 'macos'
        if (/win/i.test(platform)) return 'windows'
        return 'linux'
      } catch {
        return 'linux'
      }
    }

    /** @returns the label to show before the shortcut catalog is ready. */
    function initialShortcutLabel() {
      const platform = osPlatform()
      const profile = `${isDesktopShell() ? 'desktop' : 'web'}:${platform}`
      return formatShortcut(DEFAULTS[profile] ?? null, platform)
    }

    //#endregion

    //#region Hint component

    /**
     * Composer hint on the right shoulder above the card: current shortcut plus
     * the target mode, click to toggle. Always visible, so the binding stays
     * discoverable while typing. The outer row is the dock-stack slot that
     * reserves the tab's 24px, so no strip above the card can be covered.
     * @param props - injected stores, dictionary and toggle callback.
     * @returns the hint row.
     */
    function MultiLineHint({ t, modeStore, shortcutStore, toggle }) {
      const mode = React.useSyncExternalStore(modeStore.subscribe, modeStore.getSnapshot, modeStore.getSnapshot)
      const shortcut = React.useSyncExternalStore(shortcutStore.subscribe, shortcutStore.getSnapshot, shortcutStore.getSnapshot)
      const action = mode === MODE_MULTI ? t('toSingle') : t('toMulti')
      const meta = mode === MODE_MULTI ? t('submitHint') : null
      const rowRef = React.useRef(null)

      // Cancel exactly the row gap the composer stack is using, so the tab's
      // bottom hairline lands on the card's top edge. The docked composer gaps
      // its rows by 6px and the hero composer by 8px; reading the live value
      // (instead of trusting one of them) keeps both flush, and the observer
      // covers a hero -> docked switch that reuses the same row.
      React.useLayoutEffect(() => {
        const row = rowRef.current
        if (row === null) return undefined
        // The slot outlet's own anchor is `display: contents`; the first flex
        // ancestor carrying a row gap is the composer stack.
        let stack = row.parentElement
        while (stack !== null && !Number.isFinite(Number.parseFloat(window.getComputedStyle(stack).rowGap))) {
          stack = stack.parentElement
        }
        if (stack === null) return undefined
        const sync = () => {
          const gap = Number.parseFloat(window.getComputedStyle(stack).rowGap)
          if (Number.isFinite(gap)) row.style.setProperty('--dmi-stack-gap', `${gap}px`)
        }
        sync()
        if (typeof ResizeObserver !== 'function') return undefined
        const observer = new ResizeObserver(sync)
        observer.observe(stack)
        return () => {
          observer.disconnect()
        }
      }, [])

      return h(
        'div',
        { ref: rowRef, className: 'dmi-hint-row', 'data-ml-input-hint': '' },
        h(
          'div',
          { className: 'dmi-hint' },
          h(
            'button',
            {
              type: 'button',
              className: 'dmi-hint-button',
              title: t('hintTitle'),
              'aria-label': shortcut === null ? action : t('ariaLabel', { action, keys: shortcut }),
              onMouseDown: (event) => {
                event.preventDefault()
              },
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                toggle()
              },
            },
            meta !== null && h('span', { className: 'dmi-hint-meta' }, meta),
            meta !== null && h('span', { className: 'dmi-hint-sep', 'aria-hidden': true }, '·'),
            shortcut !== null && h('span', { className: 'dmi-hint-key' }, shortcut),
            h('span', { className: 'dmi-hint-label' }, action),
          ),
        ),
      )
    }

    //#endregion

    /**
     * Register the dictionaries, styles, stores, keyboard takeover, shortcut
     * command and the composer hint.
     * @param ctx - client plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, DICT), 'ml-input: dictionaries')

      ctx.effect(() => {
        const element = document.createElement('style')
        element.id = STYLE_ID
        element.setAttribute('data-plugin', NS)
        element.textContent = CSS
        document.head.appendChild(element)
        return () => {
          element.remove()
        }
      }, 'ml-input: styles')

      const t = ctx.locale.bind(NS)
      const modeStore = createValueStore(readMode(localStore()))
      const shortcutStore = createValueStore(initialShortcutLabel())

      const setMode = (next) => {
        const normalized = normalizeMode(next)
        modeStore.set(normalized)
        writeMode(localStore(), normalized)
        applyModeAttribute(document.documentElement, normalized)
      }
      const toggle = () => {
        setMode(nextMode(modeStore.getSnapshot()))
      }

      ctx.effect(() => {
        applyModeAttribute(document.documentElement, modeStore.getSnapshot())
        return () => {
          applyModeAttribute(document.documentElement, MODE_SINGLE)
        }
      }, 'ml-input: mode attribute')

      // Enter / Shift+Enter takeover. Capture on the document so the original
      // keydown never reaches Lexical's root, then replay the opposite gesture
      // on the editor; DSH's composer keymap owns both outcomes.
      let replaying = false
      ctx.effect(() => {
        const onKeyDown = (event) => {
          if (replaying || !(event instanceof KeyboardEvent)) return
          const target = event.target instanceof Element
            ? event.target
            : (document.activeElement instanceof Element ? document.activeElement : null)
          if (target === null) return
          const editor = target.closest(COMPOSER_INPUT)
          if (editor === null || !(editor instanceof HTMLElement)) return
          if (editor.getAttribute('contenteditable') !== 'true') return
          const card = editor.closest(COMPOSER_CARD)
          if (card === null) return
          const decision = shouldIntercept({
            mode: modeStore.getSnapshot(),
            key: event.key,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            isComposing: event.isComposing,
            keyCode: event.keyCode,
            inComposer: true,
            editable: true,
            phase: editor.getAttribute('data-phase'),
            menuOpen: card.querySelector(`${COMPOSER_OVERLAY} ${TRIGGER_MENU}`) !== null,
          })
          if (decision === null) return
          event.preventDefault()
          event.stopPropagation()
          replaying = true
          try {
            editor.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              bubbles: true,
              cancelable: true,
              composed: true,
              shiftKey: decision === 'newline',
            }))
          } finally {
            replaying = false
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          document.removeEventListener('keydown', onKeyDown, true)
        }
      }, 'ml-input: multiline enter')

      // Shortcut command. The service may materialize after this plugin, so the
      // registration waits for it; a conflicting default only costs the hotkey.
      ctx.inject(['shortcuts'], (scope) => {
        scope.effect(() => {
          const refresh = () => {
            shortcutStore.set(labelFromCatalog(scope.shortcuts.catalog.getSnapshot(), scope.shortcuts.platform))
          }
          const off = scope.shortcuts.catalog.subscribe(refresh)
          refresh()
          return () => {
            off()
          }
        }, 'ml-input: shortcut label')

        scope.effect(() => {
          let dispose = () => {}
          try {
            dispose = scope.shortcuts.register({
              id: COMMAND_ID,
              label: () => t('toggleLabel'),
              aliases: ['多行输入', '单行输入', 'multiline', 'multi-line', 'multiline-input', 'input mode'],
              defaults: DEFAULTS,
              regions: ['page', 'editable'],
              modals: [],
              resolve: (context) => {
                if (context.modal !== null) return { status: 'pass' }
                const target = context.target
                if (target !== null
                  && target.closest(COMPOSER_CARD) === null
                  && target.closest(EDITABLE_SELECTOR) !== null) {
                  return { status: 'pass' }
                }
                return {
                  status: 'handled',
                  run: () => {
                    toggle()
                  },
                }
              },
            })
          } catch (error) {
            console.warn('[dsh-multiline-input] shortcut registration skipped:', error)
          }
          return () => {
            dispose()
          }
        }, 'ml-input: shortcut command')
      })

      ctx.slots.inject(HINT_SLOT, () => ctx.slots.register({
        name: HINT_SLOT,
        id: HINT_ID,
        order: HINT_ORDER,
        locale: NS,
        inject: () => ({ t, modeStore, shortcutStore, toggle }),
      }, MultiLineHint))
    }

    return {
      inject: ['slots', 'locale'],
      apply,
      /**
       * Pure internals for `node --test`; the module loader ignores this key.
       */
      __test: {
        COMMAND_ID,
        HINT_SLOT,
        HINT_ID,
        HINT_ORDER,
        MODE_ATTRIBUTE,
        MODE_STORAGE_KEY,
        MODE_SINGLE,
        MODE_MULTI,
        MIN_LINES,
        DEFAULTS,
        normalizeMode,
        nextMode,
        readMode,
        writeMode,
        applyModeAttribute,
        formatShortcut,
        labelFromCatalog,
        shouldIntercept,
      },
    }
  },
})
