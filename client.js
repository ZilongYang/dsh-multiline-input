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
 *     strip) can never be overlapped. The tab can collapse into an 8px line on
 *     the same shoulder and remembers that choice per device;
 *   - a device-local record of every accepted submission, recalled with ↑ / ↓
 *     (single line) or Shift+↑ / Shift+↓ (multi line). The text is captured
 *     from the frozen `sending` draft and only committed once the Host accepts
 *     it (`pendingSubmissions` grows); failed sends never enter the history;
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
 * Reference contracts (source checkout, 0.2.1-rc.5, commit 31cfe2aafe):
 *   - packages/client/ui-conversation/src/client/skeleton/InputBar.tsx
 *   - packages/client/ui-conversation/src/client/skeleton/ConversationContent.tsx
 *     (composer stack: `conversation.input.dock` rows above the card)
 *   - packages/client/ui-conversation/src/client/skeleton/InputBar.module.css
 *     (`.root` side clearance, `.card` card-width cap)
 *   - packages/client/ui-conversation/src/client/input/editor/DraftEditor.tsx
 *   - packages/client/ui-conversation/src/client/input/editor/keymap.ts
 *   - packages/client/ui-conversation/src/client/contract/input.ts
 *     (`phase: 'sending'` and `pendingSubmissions` acceptance echo)
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
    /** Device-local hint posture: collapsed line or the full tab. */
    const HINT_STORAGE_KEY = 'dsh-multiline-input.hint.v1'
    const HINT_COLLAPSED = 'collapsed'
    const HINT_EXPANDED = 'expanded'
    /** Device-local accepted-submission history (never Session data). */
    const HISTORY_STORAGE_KEY = 'dsh-multiline-input.history.v1'
    const HISTORY_VERSION = 1
    const HISTORY_MAX_ENTRIES = 200
    const HISTORY_MAX_TOTAL_CHARS = 100000
    const HISTORY_MAX_ENTRY_CHARS = 16000
    const HISTORY_LIMITS = {
      entries: HISTORY_MAX_ENTRIES,
      totalChars: HISTORY_MAX_TOTAL_CHARS,
      entryChars: HISTORY_MAX_ENTRY_CHARS,
    }

    /** Shortcut command id; dotted form so DSH can persist user overrides. */
    const COMMAND_ID = 'multiline-input.toggle'
    /** Unbound second command so the user picks keys for clearing the history. */
    const CLEAR_HISTORY_COMMAND_ID = 'multiline-input.clear-history'
    /**
     * The hint lives in the composer dock stack — the in-flow rows directly
     * above the card (goal 10, queue 20, todos 0, cost strip 5). A high order
     * keeps the tab last, flush on the card's top shoulder.
     */
    const HINT_SLOT = 'conversation.input.dock'
    const HINT_ID = 'ml-input-hint'
    const HINT_ORDER = 1000
    /** The Plugins page's per-row configuration seat. */
    const SETTINGS_SLOT = 'plugins.row.config'
    const SETTINGS_KEY = 'dsh-multiline-input#multiline-input'
    /** Settings dialog section (Cmd/Ctrl+,), the primary configuration entry. */
    const SETTINGS_SECTION_SLOT = 'settings.section'
    const SETTINGS_SECTION_ID = 'multiline-input'
    const SETTINGS_SECTION_ORDER = 30
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
        collapseHint: '收起提示',
        collapseHintTitle: '收起输入提示',
        expandHint: '展开输入提示',
        expandHintTitle: '展开输入提示（快捷键仍可用）',
        historyPosition: '历史 {index}/{total}',
        historyTitle: '↑/↓ 浏览输入历史，Esc 还原草稿',
        clearHistoryLabel: '清空输入历史',
        settingsSectionLabel: '多行输入',
        settingsSummary: '收起提示、输入历史与快捷键',
        settingsShortcut: '快捷键',
        settingsShortcutDescription: '在系统设置里修改「切换多行输入」的键位。',
        settingsShortcutPath: '设置 → 通用 → 快捷键 → 切换多行输入',
        settingsOpenShortcuts: '打开设置',
        settingsOpenShortcutsDone: '已打开设置面板，请到「通用 → 快捷键」中修改。',
        settingsOpenShortcutsFailed: '请手动打开「设置 → 通用 → 快捷键」。',
        settingsCurrentKeys: '当前键位：{keys}',
        settingsUnbound: '未绑定',
        settingsHistory: '输入历史',
        settingsHistoryEmpty: '还没有记录。',
        settingsHistoryCount: '已记录 {count} 条（设备本地，最多 200 条）。',
        settingsClearHistory: '清空输入历史',
        settingsClearConfirm: '确认清空？',
        settingsCleared: '已清空。',
        settingsHint: '提示 tab',
        settingsHintDescription: '收起后输入区回收约 16px，快捷键不受影响。',
        settingsCollapseNow: '收起提示',
        settingsExpandNow: '展开提示',
        ariaLabel: '{action}（{keys}）',
      },
      en: {
        toMulti: 'Multiline input',
        toSingle: 'Single-line input',
        submitHint: 'Shift+Enter to send',
        toggleLabel: 'Toggle multiline input',
        hintTitle: 'Click to switch the input mode. Edit the shortcut in Settings → General → Keyboard shortcuts.',
        collapseHint: 'Hide hint',
        collapseHintTitle: 'Hide the input hint',
        expandHint: 'Show input hint',
        expandHintTitle: 'Show the input hint (the shortcut still works)',
        historyPosition: 'History {index}/{total}',
        historyTitle: '↑/↓ browse input history; Esc restores the draft',
        clearHistoryLabel: 'Clear input history',
        settingsSectionLabel: 'Multiline input',
        settingsSummary: 'Collapsible hint, input history, and shortcut',
        settingsShortcut: 'Shortcut',
        settingsShortcutDescription: 'Change the “Toggle multiline input” binding in Settings.',
        settingsShortcutPath: 'Settings → General → Keyboard shortcuts → Toggle multiline input',
        settingsOpenShortcuts: 'Open Settings',
        settingsOpenShortcutsDone: 'Settings is open; go to General → Keyboard shortcuts to edit it.',
        settingsOpenShortcutsFailed: 'Open Settings → General → Keyboard shortcuts manually.',
        settingsCurrentKeys: 'Current binding: {keys}',
        settingsUnbound: 'Unbound',
        settingsHistory: 'Input history',
        settingsHistoryEmpty: 'Nothing recorded yet.',
        settingsHistoryCount: '{count} messages recorded (device-local, up to 200).',
        settingsClearHistory: 'Clear input history',
        settingsClearConfirm: 'Clear for sure?',
        settingsCleared: 'Cleared.',
        settingsHint: 'Hint tab',
        settingsHintDescription: 'Collapsing gives the composer about 16px back; the shortcut still works.',
        settingsCollapseNow: 'Collapse hint',
        settingsExpandNow: 'Show hint',
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
  align-items: center;
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
/* Collapsed: an 8px strip whose 2px line reads as the card's shoulder seam.
   The cancelled stack gap leaves 2px docked / 0px in the hero composer, so the
   input area reclaims the tab's height instead of keeping dead space. */
.dmi-hint-row-collapsed {
  height: 8px;
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
  padding: 0 6px 0 12px;
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
.dmi-hint-history {
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}
/* The collapse affordance sits inside the tab, past a hairline, so collapsing
   never competes with the mode-toggle hit area. */
.dmi-hint-collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
  border: 0;
  border-left: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 0 var(--dsw-radius-sm, 6px) 0 0;
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  pointer-events: auto;
}
.dmi-hint-collapse:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
/* The collapsed marker: a short, high-contrast seam the eye can still find. */
.dmi-hint-line {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  width: 96px;
  height: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  pointer-events: auto;
  transition: background 120ms ease, color 120ms ease;
}
/* Enlarge the hit area without spending layout: the strip sits in the stack
   gap and the card's top padding is blank, so the extension never steals a
   control. */
.dmi-hint-line::after {
  content: '';
  position: absolute;
  inset: -6px -10px;
}
.dmi-hint-seam {
  display: block;
  width: 40px;
  height: 3px;
  border-radius: 2px;
  background: currentColor;
  transition: width 120ms ease;
}
.dmi-hint-chevron {
  opacity: 0.55;
  transition: opacity 120ms ease;
}
.dmi-hint-line:hover,
.dmi-hint-line:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
  outline: none;
}
.dmi-hint-line:hover .dmi-hint-seam,
.dmi-hint-line:focus-visible .dmi-hint-seam {
  width: 56px;
}
.dmi-hint-line:hover .dmi-hint-chevron,
.dmi-hint-line:focus-visible .dmi-hint-chevron {
  opacity: 1;
}
/* Plugins page configuration: plain native controls with DSH tokens so the
   hand-written bundle needs no primitives import. */
.dmi-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}
.dmi-settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md, 12px);
}
.dmi-settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.dmi-settings-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dmi-settings-desc {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}
.dmi-settings-path {
  margin: 0;
  padding: 4px 8px;
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dmi-settings-button {
  align-self: flex-start;
  margin: 0;
  padding: 4px 10px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
.dmi-settings-button:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dmi-settings-danger {
  color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-secondary));
}
.dmi-settings-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-caption);
}
html[${MODE_ATTRIBUTE}="multi"] [data-composer-card] [data-composer-input][contenteditable="true"] {
  min-height: calc(${MIN_LINES} * 1lh + 8px);
}
@supports not (height: 1lh) {
  /* Plugins page configuration: plain native controls with DSH tokens so the
   hand-written bundle needs no primitives import. */
.dmi-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}
.dmi-settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md, 12px);
}
.dmi-settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.dmi-settings-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dmi-settings-desc {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}
.dmi-settings-path {
  margin: 0;
  padding: 4px 8px;
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dmi-settings-button {
  align-self: flex-start;
  margin: 0;
  padding: 4px 10px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
.dmi-settings-button:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dmi-settings-danger {
  color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-secondary));
}
.dmi-settings-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-caption);
}
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

    /**
     * Coerce a stored hint posture into one of the two known values.
     * @param value - raw preference value.
     * @returns `collapsed` or `expanded`.
     */
    function normalizeCollapsed(value) {
      return value === HINT_COLLAPSED ? HINT_COLLAPSED : HINT_EXPANDED
    }

    /**
     * @param value - raw or normalized hint posture.
     * @returns whether the hint is collapsed.
     */
    function isCollapsed(value) {
      return normalizeCollapsed(value) === HINT_COLLAPSED
    }

    /**
     * Read the persisted hint posture.
     * @param store - `localStorage`-like object, or undefined.
     * @returns the stored posture, defaulting to expanded.
     */
    function readCollapsed(store) {
      try {
        return normalizeCollapsed(store?.getItem(HINT_STORAGE_KEY))
      } catch {
        return HINT_EXPANDED
      }
    }

    /**
     * Persist the hint posture; a blocked backend only costs the preference.
     * @param store - `localStorage`-like object, or undefined.
     * @param value - posture to persist.
     */
    function writeCollapsed(store, value) {
      try {
        store?.setItem(HINT_STORAGE_KEY, normalizeCollapsed(value))
      } catch {
        /* Preference persistence is best-effort. */
      }
    }

    /**
     * Normalize one history entry; anything unreadable is dropped rather than
     * guessed, so a damaged document cannot inject a wrong recall.
     * @param value - candidate entry from storage.
     * @returns a clean entry, or null.
     */
    function sanitizeHistoryEntry(value) {
      if (value === null || typeof value !== 'object') return null
      if (typeof value.text !== 'string') return null
      const text = value.text.trim()
      if (text === '' || text.length > HISTORY_MAX_ENTRY_CHARS) return null
      const at = Number.isFinite(value.at) ? value.at : 0
      return { text, at }
    }

    /**
     * Trim a history list to the entry and character budgets, keeping order.
     * @param entries - candidate entries, newest first.
     * @param limits - budgets to enforce.
     * @returns the retained entries.
     */
    function trimHistory(entries, limits = HISTORY_LIMITS) {
      const out = []
      let chars = 0
      for (const entry of entries) {
        if (out.length >= limits.entries) break
        const text = typeof entry?.text === 'string' ? entry.text : ''
        if (text === '' || text.length > limits.entryChars) continue
        if (chars + text.length > limits.totalChars) continue
        out.push(entry)
        chars += text.length
      }
      return out
    }

    /**
     * Decode a stored history document, tolerating the legacy bare array and
     * any corruption (the history is a convenience, never a correctness input).
     * @param raw - parsed value or the raw JSON string.
     * @returns clean entries, newest first.
     */
    function sanitizeHistory(raw) {
      let list = raw
      if (typeof raw === 'string') {
        try {
          list = JSON.parse(raw)
        } catch {
          return []
        }
      }
      if (list !== null && typeof list === 'object' && !Array.isArray(list)) list = list.entries
      if (!Array.isArray(list)) return []
      const out = []
      const seen = new Set()
      for (const candidate of list) {
        const entry = sanitizeHistoryEntry(candidate)
        if (entry === null || seen.has(entry.text)) continue
        seen.add(entry.text)
        out.push(entry)
      }
      return trimHistory(out)
    }

    /**
     * Normalize a submitted draft into a history text, or reject it.
     * @param text - submitted draft projection.
     * @param limits - budgets to enforce.
     * @returns the cleaned text, or null when it must not be recorded.
     */
    function cleanHistoryText(text, limits = HISTORY_LIMITS) {
      if (typeof text !== 'string') return null
      const clean = text.trim()
      if (clean === '' || clean.startsWith('/') || clean.length > limits.entryChars) return null
      return clean
    }

    /**
     * Record one submission at the head of the history.
     * @param entries - current history, newest first.
     * @param text - submitted draft projection.
     * @param at - submission timestamp.
     * @param limits - budgets to enforce.
     * @returns the next history (the same reference when nothing was recorded).
     */
    function recordHistory(entries, text, at = Date.now(), limits = HISTORY_LIMITS) {
      const clean = cleanHistoryText(text, limits)
      if (clean === null) return entries
      const rest = entries.filter((entry) => entry.text !== clean)
      return trimHistory([{ text: clean, at }, ...rest], limits)
    }

    /**
     * Read the device history; unreadable storage degrades to empty.
     * @param store - `localStorage`-like object, or undefined.
     * @returns clean entries.
     */
    function readHistory(store) {
      try {
        return sanitizeHistory(store?.getItem(HISTORY_STORAGE_KEY))
      } catch {
        return []
      }
    }

    /**
     * Persist the history; quota or privacy failures only cost the record.
     * @param store - `localStorage`-like object, or undefined.
     * @param entries - entries to persist.
     */
    function writeHistory(store, entries) {
      try {
        store?.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: HISTORY_VERSION, entries }))
      } catch {
        /* History persistence is best-effort. */
      }
    }

    /**
     * Advance the pending-submission capture from one render observation.
     *
     * `sending` freezes the draft while the Host decides, so the draft read
     * there is exactly what the user submitted. A new pending-submission id
     * means the Host accepted it; a new `sending` before that means the
     * previous attempt failed and must not be recorded.
     * @param state - `{ text }` capture slot.
     * @param observation - current phase, draft, and whether a pending id appeared.
     * @returns the next capture state and an optional accepted text to record.
     */
    function advanceCapture(state, observation) {
      const phase = observation?.phase
      const draft = typeof observation?.draft === 'string' ? observation.draft : ''
      let text = state === null || state === undefined || typeof state.text !== 'string' ? null : state.text
      let commit = null
      // Acceptance first: the Host may accept one message as the next sending
      // starts, so both transitions can land in a single observation.
      if (text !== null && observation?.newPending === true) {
        commit = text
        text = null
      }
      if (phase === 'sending' && (text === null || draft !== text)) text = draft
      return { state: { text }, commit }
    }

    /**
     * Decide whether one keydown is a history-browsing gesture.
     * Directive keys stay ordinary caret/selection motion unless the mode's
     * history chord is used and the composer owns a plain draft.
     * @param input - flattened event, composer, and browse facts.
     * @returns `older`, `newer`, `exit`, or null to pass.
     */
    function resolveBrowseIntent(input) {
      const { mode, key, shiftKey, ctrlKey, metaKey, altKey, isComposing, keyCode,
        phase, menuOpen, inComposer, browsing } = input
      if (ctrlKey === true || metaKey === true || altKey === true) return null
      if (isComposing === true || keyCode === 229) return null
      if (inComposer !== true || phase !== 'plain' || menuOpen === true) return null
      if (key === 'Escape') return browsing === true ? 'exit' : null
      const up = key === 'ArrowUp'
      const down = key === 'ArrowDown'
      if (!up && !down) return null
      const multi = normalizeMode(mode) === MODE_MULTI
      if (multi ? shiftKey !== true : shiftKey === true) return null
      if (up) return 'older'
      return browsing === true ? 'newer' : null
    }

    /**
     * Step through the history with wraparound.
     * @param index - current zero-based position, newest = 0.
     * @param total - number of entries.
     * @param direction - `older` or `newer`.
     * @returns the next position.
     */
    function nextBrowseIndex(index, total, direction) {
      if (!(total > 0)) return 0
      if (direction === 'older') return (index + 1) % total
      return (index - 1 + total) % total
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

    /** Device-local hint posture. */
    const hintStore = createValueStore(readCollapsed(localStore()))
    /** Device-local accepted-submission history, newest first. */
    const historyStore = createValueStore(readHistory(localStore()))
    /** Browse cursor over the history; `saved` is the draft to restore. */
    const browseStore = createValueStore({ active: false, index: 0, saved: '' })

    /**
     * Persist one hint posture and publish it.
     * @param collapsed - whether the hint should collapse.
     */
    function setCollapsed(collapsed) {
      const value = collapsed === true ? HINT_COLLAPSED : HINT_EXPANDED
      hintStore.set(value)
      writeCollapsed(localStore(), value)
    }

    /**
     * Record one accepted submission and persist the new history.
     * @param text - submitted draft projection.
     */
    function recordHistoryEntry(text) {
      const next = recordHistory(historyStore.getSnapshot(), text, Date.now())
      if (next === historyStore.getSnapshot()) return
      historyStore.set(next)
      writeHistory(localStore(), next)
    }

    /** Drop the whole input history and leave browsing. */
    function clearHistory() {
      historyStore.set([])
      writeHistory(localStore(), [])
      browseStore.set({ active: false, index: 0, saved: '' })
    }

    /** Leave history browsing without touching the draft. */
    function resetBrowse() {
      if (browseStore.getSnapshot().active !== true) return
      browseStore.set({ active: false, index: 0, saved: '' })
    }

    //#endregion

    //#region Hint component

    /** Keys that are modifiers alone; they must not end a browse session. */
    const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'])

    /**
     * Composer hint on the right shoulder above the card: current shortcut plus
     * the target mode, click to toggle; collapses into a shoulder seam. The
     * outer row is the dock-stack slot that reserves the tab's space, so no
     * strip above the card can be covered. While the composer is focused the
     * component also owns submitted-text history recall (↑ / ↓, Shift+↑/↓).
     * @param props - standard session props, injected stores, dictionary, and
     * toggle callback.
     * @returns the hint row.
     */
    function MultiLineHint({ t, modeStore, shortcutStore, toggle, useInput, useSession, inputActions }) {
      const mode = React.useSyncExternalStore(modeStore.subscribe, modeStore.getSnapshot, modeStore.getSnapshot)
      const shortcut = React.useSyncExternalStore(shortcutStore.subscribe, shortcutStore.getSnapshot, shortcutStore.getSnapshot)
      const collapsed = isCollapsed(React.useSyncExternalStore(hintStore.subscribe, hintStore.getSnapshot, hintStore.getSnapshot))
      const browse = React.useSyncExternalStore(browseStore.subscribe, browseStore.getSnapshot, browseStore.getSnapshot)
      const entries = React.useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getSnapshot)
      const phase = useInput((value) => value.phase)
      const draft = useInput((value) => value.draft)
      const pending = useSession((value) => value.pendingSubmissions)
      const rowRef = React.useRef(null)
      const liveRef = React.useRef({ phase, draft, mode, browse })
      const captureRef = React.useRef({ text: null })
      const seenPendingRef = React.useRef(null)
      /** Last non-empty plain draft: rc.5 has no `sending` freeze, so the echo appears at submit. */
      const lastDraftRef = React.useRef('')
      /** Whether this DSH build ever exposed the frozen `sending` phase (0.2.2+). */
      const sendingSeenRef = React.useRef(phase === 'sending')

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

      // Keep the synchronous keydown handler reading the freshest values.
      React.useLayoutEffect(() => {
        liveRef.current = { phase, draft, mode, browse }
        // The rc.5 echo lands in the batch that clears the draft, so the last
        // non-empty draft must be current before that effect runs.
        if (typeof draft === 'string' && draft.trim() !== '') lastDraftRef.current = draft
      }, [phase, draft, mode, browse])

      // Record accepted submissions. DSH 0.2.2+ freezes the draft in
      // `sending` and adds the echo only on acceptance, so the captured draft
      // is committed immediately. rc.5 echoes optimistically at submit and puts
      // a failed draft back, so the draft captured at submit is committed when
      // that echo retires, unless the same draft reappeared (failure).
      React.useEffect(() => {
        const list = Array.isArray(pending) ? pending : []
        const current = new Set(list.map((item) => (item === null || item === undefined ? '' : item.requestId)))
        const previous = seenPendingRef.current
        seenPendingRef.current = current
        if (previous === null) return
        if (phase === 'sending') sendingSeenRef.current = true
        const added = list.filter((item) => item !== null && item !== undefined && !previous.has(item.requestId))
        const next = advanceCapture(captureRef.current, { phase, draft, newPending: added.length > 0 })
        captureRef.current = next.state
        if (next.commit !== null) recordHistoryEntry(next.commit)
        if (!sendingSeenRef.current && captureRef.current.text === null) {
          // rc.5 echoes at submit. Record each one immediately so ordinary,
          // queued, steering, and even rejected submissions stay recallable.
          for (const item of added) {
            if (typeof item.text !== 'string' || item.text.trim() === '') continue
            const text = cleanHistoryText(lastDraftRef.current)
            if (text !== null) recordHistoryEntry(text)
          }
        }
        if (phase === 'sending') {
          browseStore.set({ active: false, index: 0, saved: '' })
        }
      }, [phase, draft, pending])

      // History navigation. Capture on document so the editor never sees the
      // history chord; replacement still rides the public InputActions face so
      // undo merging, chips, and IME handling stay DSH's own.
      React.useEffect(() => {
        if (inputActions === null || inputActions === undefined) return undefined
        const onKeyDown = (event) => {
          if (!(event instanceof KeyboardEvent)) return
          const target = event.target instanceof Element ? event.target : null
          if (target === null) return
          const editor = target.closest(COMPOSER_INPUT)
          if (editor === null || !(editor instanceof HTMLElement)) return
          if (editor.getAttribute('contenteditable') !== 'true') return
          const card = editor.closest(COMPOSER_CARD)
          if (card === null) return
          const live = liveRef.current
          const menuOpen = card.querySelector(`${COMPOSER_OVERLAY} ${TRIGGER_MENU}`) !== null
          const intent = resolveBrowseIntent({
            mode: live.mode,
            key: event.key,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            isComposing: event.isComposing,
            keyCode: event.keyCode,
            phase: live.phase,
            menuOpen,
            inComposer: true,
            browsing: live.browse.active === true,
          })
          if (intent === null) {
            if (live.browse.active === true && !MODIFIER_KEYS.has(event.key)) {
              browseStore.set({ active: false, index: 0, saved: '' })
              liveRef.current = { ...live, browse: { active: false, index: 0, saved: '' } }
            }
            return
          }
          const list = historyStore.getSnapshot()
          if (intent === 'older' && live.browse.active !== true && list.length === 0) return
          event.preventDefault()
          event.stopPropagation()
          if (intent === 'exit' || (intent === 'newer' && live.browse.active === true && live.browse.index === 0)) {
            const saved = live.browse.saved
            const nextBrowse = { active: false, index: 0, saved: '' }
            browseStore.set(nextBrowse)
            liveRef.current = { ...live, browse: nextBrowse }
            inputActions.setDraft(saved)
            inputActions.persistDraft()
            return
          }
          const saved = live.browse.active === true ? live.browse.saved : live.draft
          const index = live.browse.active === true ? nextBrowseIndex(live.browse.index, list.length, intent) : 0
          const entry = list[index]
          if (entry === undefined) return
          const nextBrowse = { active: true, index, saved }
          browseStore.set(nextBrowse)
          liveRef.current = { ...live, browse: nextBrowse, draft: entry.text }
          inputActions.setDraft(entry.text)
          inputActions.persistDraft()
        }
        const onEdit = () => {
          if (liveRef.current.browse.active === true) {
            const nextBrowse = { active: false, index: 0, saved: '' }
            browseStore.set(nextBrowse)
            liveRef.current = { ...liveRef.current, browse: nextBrowse }
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        document.addEventListener('paste', onEdit, true)
        document.addEventListener('cut', onEdit, true)
        return () => {
          document.removeEventListener('keydown', onKeyDown, true)
          document.removeEventListener('paste', onEdit, true)
          document.removeEventListener('cut', onEdit, true)
        }
      }, [inputActions])

      const action = mode === MODE_MULTI ? t('toSingle') : t('toMulti')
      const meta = browse.active === true || mode !== MODE_MULTI ? null : t('submitHint')
      const label = browse.active === true
        ? t('historyPosition', { index: browse.index + 1, total: entries.length })
        : action

      if (collapsed) {
        return h(
          'div',
          { ref: rowRef, className: 'dmi-hint-row dmi-hint-row-collapsed', 'data-ml-input-hint': '' },
          h(
            'button',
            {
              type: 'button',
              className: 'dmi-hint-line',
              title: t('expandHintTitle'),
              'aria-label': t('expandHint'),
              'aria-expanded': false,
              onMouseDown: (event) => {
                event.preventDefault()
              },
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                setCollapsed(false)
              },
            },
            h('span', { className: 'dmi-hint-seam', 'aria-hidden': true }),
            h(
              'svg',
              { className: 'dmi-hint-chevron', viewBox: '0 0 12 12', width: 10, height: 10, 'aria-hidden': true },
              h('path', {
                d: 'M2.5 7.5 6 4l3.5 3.5',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.4,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }),
            ),
          ),
        )
      }

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
              title: browse.active === true ? t('historyTitle') : t('hintTitle'),
              'aria-label': shortcut === null ? label : t('ariaLabel', { action: label, keys: shortcut }),
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
            h('span', { className: browse.active === true ? 'dmi-hint-history' : 'dmi-hint-label' }, label),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dmi-hint-collapse',
              title: t('collapseHintTitle'),
              'aria-label': t('collapseHint'),
              'aria-expanded': true,
              onMouseDown: (event) => {
                event.preventDefault()
              },
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                setCollapsed(true)
              },
            },
            h(
              'svg',
              { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': true },
              h('path', {
                d: 'M2.5 4.5 6 8l3.5-3.5',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.4,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }),
            ),
          ),
        ),
      )
    }

    //#endregion

    //#region Plugins page configuration

    /**
     * Best-effort open of the settings panel: DSH exposes no public
     * "open section" API, so this clicks the sidebar trigger when it can find
     * it and otherwise reports failure (the page always shows the path too).
     * @returns whether a settings trigger was clicked.
     */
    function openSettingsPanel() {
      try {
        const buttons = [...document.querySelectorAll('button[aria-haspopup="dialog"]')]
        const outside = buttons.filter((button) => button.closest('[role="dialog"]') === null)
        const target = outside.find((button) => /Comma/u.test(button.getAttribute('aria-keyshortcuts') ?? '')) ?? outside[0]
        if (target === undefined) return false
        if (target.getAttribute('aria-expanded') === 'true') return true
        target.click()
        return true
      } catch {
        return false
      }
    }

    /**
     * Render the plugin's configuration page on the Plugins detail view.
     * @param props - owner view, dictionary, stores, and write actions.
     * @returns the summary line or the settings sections.
     */
    function MultiLineSettingsBody({ t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed, showOpenButton = true }) {
      const entries = React.useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getSnapshot)
      const collapsed = isCollapsed(React.useSyncExternalStore(hintStore.subscribe, hintStore.getSnapshot, hintStore.getSnapshot))
      const shortcut = React.useSyncExternalStore(shortcutStore.subscribe, shortcutStore.getSnapshot, shortcutStore.getSnapshot)
      const [opened, setOpened] = React.useState(null)
      const [confirming, setConfirming] = React.useState(false)
      const [cleared, setCleared] = React.useState(false)
      const keys = shortcut === null ? t('settingsUnbound') : shortcut
      const count = entries.length
      return h(
        'div',
        { className: 'dmi-settings', 'data-ml-input-settings': '' },
        h(
          'section',
          { className: 'dmi-settings-section' },
          h('div', { className: 'dmi-settings-head' }, h('h3', { className: 'dmi-settings-title' }, t('settingsShortcut'))),
          h('p', { className: 'dmi-settings-desc' }, t('settingsShortcutDescription')),
          h('p', { className: 'dmi-settings-path' }, t('settingsShortcutPath')),
          h('p', { className: 'dmi-settings-desc' }, t('settingsCurrentKeys', { keys })),
          showOpenButton && h(
            'button',
            {
              type: 'button',
              className: 'dmi-settings-button',
              onClick: () => {
                const ok = openSettingsPanel()
                setOpened(ok ? 'ok' : 'failed')
              },
            },
            t('settingsOpenShortcuts'),
          ),
          showOpenButton && opened === 'ok' && h('p', { className: 'dmi-settings-note' }, t('settingsOpenShortcutsDone')),
          showOpenButton && opened === 'failed' && h('p', { className: 'dmi-settings-note' }, t('settingsOpenShortcutsFailed')),
        ),
        h(
          'section',
          { className: 'dmi-settings-section' },
          h('div', { className: 'dmi-settings-head' }, h('h3', { className: 'dmi-settings-title' }, t('settingsHistory'))),
          h('p', { className: 'dmi-settings-desc' }, count === 0 ? t('settingsHistoryEmpty') : t('settingsHistoryCount', { count })),
          h(
            'button',
            {
              type: 'button',
              className: confirming ? 'dmi-settings-button dmi-settings-danger' : 'dmi-settings-button',
              onClick: () => {
                if (confirming) {
                  clearHistory()
                  setConfirming(false)
                  setCleared(true)
                } else {
                  setConfirming(true)
                  setCleared(false)
                }
              },
            },
            confirming ? t('settingsClearConfirm') : t('settingsClearHistory'),
          ),
          cleared && h('p', { className: 'dmi-settings-note' }, t('settingsCleared')),
        ),
        h(
          'section',
          { className: 'dmi-settings-section' },
          h('div', { className: 'dmi-settings-head' }, h('h3', { className: 'dmi-settings-title' }, t('settingsHint'))),
          h('p', { className: 'dmi-settings-desc' }, t('settingsHintDescription')),
          h(
            'button',
            {
              type: 'button',
              className: 'dmi-settings-button',
              onClick: () => {
                setCollapsed(!collapsed)
              },
            },
            collapsed ? t('settingsExpandNow') : t('settingsCollapseNow'),
          ),
        ),
      )
    }

    /**
     * Render the Plugins-page row configuration entry.
     * @param props - owner view, dictionary, stores, and write actions.
     * @returns the summary line or the shared settings body.
     */
    function MultiLineSettings({ view, t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed }) {
      if (view === 'summary') return t('settingsSummary')
      return h(MultiLineSettingsBody, { t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed })
    }

    /**
     * Render the Settings dialog section (the primary entry, opened with Cmd/Ctrl+,).
     * @param props - dictionary, stores, and write actions; the shell owns chrome.
     * @returns the shared settings body.
     */
    function MultiLineSettingsSection({ t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed }) {
      // Already inside Settings: the path text guides to General → Shortcuts,
      // and an "open Settings" button would be a no-op here.
      return h(MultiLineSettingsBody, { t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed, showOpenButton: false })
    }

    //#endregion

    /**
     * Register the dictionaries, styles, stores, keyboard takeover, shortcut
     * commands and the composer hint.
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

      // Shortcut commands. The service may materialize after this plugin, so
      // the registrations wait for it; a conflicting default only costs the
      // hotkey, and the clear command is unbound by design.
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

        scope.effect(() => {
          let dispose = () => {}
          try {
            dispose = scope.shortcuts.register({
              id: CLEAR_HISTORY_COMMAND_ID,
              label: () => t('clearHistoryLabel'),
              aliases: ['清空输入历史', '输入历史', 'clear input history', 'clear history'],
              defaults: {},
              regions: ['page', 'editable'],
              modals: [],
              resolve: (context) => {
                if (context.modal !== null) return { status: 'pass' }
                return {
                  status: 'handled',
                  run: () => {
                    clearHistory()
                  },
                }
              },
            })
          } catch (error) {
            console.warn('[dsh-multiline-input] clear-history registration skipped:', error)
          }
          return () => {
            dispose()
          }
        }, 'ml-input: clear history command')
      })

      ctx.slots.inject(HINT_SLOT, () => ctx.slots.register({
        name: HINT_SLOT,
        id: HINT_ID,
        order: HINT_ORDER,
        locale: NS,
        inject: () => ({ t, modeStore, shortcutStore, toggle }),
      }, MultiLineHint))

      ctx.slots.inject(SETTINGS_SLOT, () => ctx.slots.register({
        name: SETTINGS_SLOT,
        key: SETTINGS_KEY,
        locale: NS,
        inject: () => ({ t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed }),
      }, MultiLineSettings))

      ctx.slots.inject(SETTINGS_SECTION_SLOT, () => ctx.slots.register({
        name: SETTINGS_SECTION_SLOT,
        id: SETTINGS_SECTION_ID,
        order: SETTINGS_SECTION_ORDER,
        label: () => t('settingsSectionLabel'),
        locale: NS,
        inject: () => ({ t, historyStore, hintStore, shortcutStore, clearHistory, setCollapsed }),
      }, MultiLineSettingsSection))
    }

    return {
      inject: ['slots', 'locale'],
      apply,
      /**
       * Pure internals for `node --test`; the module loader ignores this key.
       */
      __test: {
        COMMAND_ID,
        CLEAR_HISTORY_COMMAND_ID,
        SETTINGS_SLOT,
        SETTINGS_KEY,
        SETTINGS_SECTION_SLOT,
        SETTINGS_SECTION_ID,
        SETTINGS_SECTION_ORDER,
        HINT_SLOT,
        HINT_ID,
        HINT_ORDER,
        MODE_ATTRIBUTE,
        MODE_STORAGE_KEY,
        HINT_STORAGE_KEY,
        HINT_COLLAPSED,
        HINT_EXPANDED,
        HISTORY_STORAGE_KEY,
        HISTORY_VERSION,
        HISTORY_MAX_ENTRIES,
        HISTORY_MAX_TOTAL_CHARS,
        HISTORY_MAX_ENTRY_CHARS,
        HISTORY_LIMITS,
        MODE_SINGLE,
        MODE_MULTI,
        MIN_LINES,
        DEFAULTS,
        MultiLineHint,
        MultiLineSettings,
        MultiLineSettingsBody,
        MultiLineSettingsSection,
        openSettingsPanel,
        hintStore,
        setCollapsed,
        historyStore,
        browseStore,
        recordHistoryEntry,
        normalizeMode,
        nextMode,
        readMode,
        writeMode,
        applyModeAttribute,
        normalizeCollapsed,
        isCollapsed,
        readCollapsed,
        writeCollapsed,
        sanitizeHistoryEntry,
        sanitizeHistory,
        trimHistory,
        cleanHistoryText,
        recordHistory,
        readHistory,
        writeHistory,
        advanceCapture,
        resolveBrowseIntent,
        nextBrowseIndex,
        formatShortcut,
        labelFromCatalog,
        shouldIntercept,
      },
    }
  },
})
