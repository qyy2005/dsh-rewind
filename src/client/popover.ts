/**
 * The rewind mode-selection popover (plain DOM, no React). Step two of the
 * `/rewind` text flow: the target is already fixed (the picked message); the
 * popover offers the two modes. Choosing "both" fetches the impact list over
 * the host `/api` preview route and shows it before confirming.
 *
 * Keyboard: ↑/↓ move focus across the step's ACTION buttons only (the two
 * modes, or the confirm button on the impact step), Enter activates the
 * focused button (native), Esc is the keyboard twin of the ghost back button
 * (impact step) and of cancel (modes step); the ghosts are never in the arrow
 * cycle. The listener runs in the document capture phase so the keys are
 * stolen from the composer while the popover is open.
 *
 * @module dsh-rewind/client/popover
 */

import type { SessionFace } from '@deepseek-ai/dsh-api-session-controller/client'
import type { CommandNode } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { chatNodesOf, type ChatOf, type ChatWatch, type HiddenChat } from './hidden.ts'
import type { PreviewCall, PreviewOutcome } from './host-api.ts'
import type { RewindKey } from './locales.ts'
import { guardPlacement } from './placement-guard.ts'
import { CLASS } from './styles.ts'

type Translate = (key: RewindKey, params?: Record<string, unknown>) => string

export interface PopoverOptions {
  readonly session: SessionFace
  /** The target message seq. */
  readonly seq?: number
  /** The target message time. */
  readonly time?: number
  readonly preview: string
  /** The element the popover is positioned against (outside-click ignore target). */
  readonly anchor: HTMLElement
  /** Preferred side of the anchor; defaults to above. */
  readonly placement?: 'above' | 'below'
  readonly t: Translate
  /**
   * Execute one rewind in the given mode. The popover closes itself first;
   * the callback owns the command + composer-refill lifecycle (see
   * runRewindAndFill in rewind-flow.ts).
   */
  readonly onRewind?: (mode: 'chat' | 'both') => void
  /** Pending variant: retract a pre-sent steering message (single-confirm flow). */
  readonly retract?: { readonly itemId: string; readonly text: string | null }
  /** Pending variant: executed after the retract confirm closes the popover. */
  readonly onRetract?: () => void
}

/** The single live popover element, or null when closed. */
let popoverEl: HTMLElement | null = null

/** The trigger of the live popover, so its `aria-expanded` can be cleared. */
let popoverAnchor: HTMLElement | null = null

let disposeOutside: (() => void) | null = null

/** The session whose popover currently holds the keyboard, or null. */
let liveSessionId: string | null = null

/** The plugin's composer focus channel; the harness's own `focusComposer` shape. */
let composerFocuser: ((sessionId: string) => void) | null = null

/** Monotonic identity for one popover's CSS anchor name. */
let anchorSequence = 0

/**
 * Register the composer focus channel (called once by the client plugin).
 * @param focus - returns the keyboard to one session's composer, caret included.
 */
export function registerComposerFocuser(focus: (sessionId: string) => void): void {
  composerFocuser = focus
}

/** Announce that `anchor` now owns the popover. */
function markOpen(anchor: HTMLElement): void {
  popoverAnchor = anchor
  anchor.setAttribute('aria-expanded', 'true')
}

/** Clear the trigger's expanded state; safe when nothing is open. */
function markClosed(): void {
  popoverAnchor?.setAttribute('aria-expanded', 'false')
  popoverAnchor = null
}

/** Close the current popover, if any, handing the keyboard back to its composer. */
export function closePopover(): void {
  if (popoverEl !== null) {
    popoverEl.remove()
    popoverEl = null
  }
  if (disposeOutside !== null) {
    disposeOutside()
    disposeOutside = null
  }
  markClosed()
  const sessionId = liveSessionId
  liveSessionId = null
  if (sessionId !== null) {
    try {
      composerFocuser?.(sessionId)
    } catch {
      // Focus is presentation; the popover is already gone.
    }
  }
}

/** Find the newest rewind command node matching a predicate. */
function findCommand(chat: HiddenChat | undefined, match: (node: CommandNode) => boolean): CommandNode | undefined {
  if (chat === undefined) return undefined
  let found: CommandNode | undefined
  // `nodes.values()` includes command rows the visibility layer hid, and its
  // order is store insertion order — not anchor order. Compare seq so a hidden
  // command still settles the wait instead of being missed.
  for (const node of chatNodesOf(chat)) {
    if (node.kind !== 'command') continue
    const command = node.data as CommandNode
    if (!match(command)) continue
    if (found === undefined || command.seq >= found.seq) found = command
  }
  return found
}

/**
 * Seqs of the command nodes currently matching `match`. Sample BEFORE issuing
 * a new command of the same shape so the subsequent wait can exclude them: a
 * repeated rewind of the same target must not settle on the previous command's
 * stale outcome.
 */
export function knownCommandSeqs(session: SessionFace, chatOf: ChatOf, match: (node: CommandNode) => boolean): Set<number> {
  const known = new Set<number>()
  const chat = chatOf(session)
  if (chat === undefined) return known
  for (const node of chatNodesOf(chat)) {
    if (node.kind !== 'command') continue
    const command = node.data as CommandNode
    if (match(command)) known.add(command.seq)
  }
  return known
}

/**
 * Resolve the outcome of the newest matching rewind command by watching the
 * session snapshot (command/run + command/done land as one CommandNode).
 * @returns the outcome text-bearing node, or null on timeout.
 */
export function waitForCommand(
  session: SessionFace,
  chatOf: ChatOf,
  match: (node: CommandNode) => boolean,
  timeoutMs = 8000,
  watch: (cb: () => void) => () => void,
): Promise<{ kind: 'success' | 'error'; text?: string } | null> {
  return new Promise(resolve => {
    let settled = false
    const settle = (value: { kind: 'success' | 'error'; text?: string } | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      unsubscribe()
      resolve(value)
    }
    const check = (): void => {
      const node = findCommand(chatOf(session), match)
      if (node?.outcome !== null && node?.outcome !== undefined) {
        settle({ kind: node.outcome.kind, text: node.outcome.text })
      }
    }
    // The chat-update signal: the session face's `subscribe` does
    // not fire when the chat snapshot changes (the chat moved to the
    // `uiConversation` view), so the waiting caller passes a watch bound to
    // that view.
    const unsubscribe = watch(check)
    const timer = setTimeout(() => settle(null), timeoutMs)
    check()
  })
}

/** The preview transport before registration and after unload. */
const UNAVAILABLE: PreviewCall = () =>
  Promise.resolve({ kind: 'error', text: 'host query is unavailable' })

/** The registered host call; the unavailable default until apply registers one. */
let previewCall: PreviewCall = UNAVAILABLE

/** Register the host preview call; null restores the unavailable default. */
export function registerPreviewCall(call: PreviewCall | null): void {
  previewCall = call ?? UNAVAILABLE
}

/** Resolve one target's impact through the host preview route. */
function previewImpact(sessionId: string, seq: number): Promise<PreviewOutcome> {
  return previewCall(sessionId, seq)
}

/** Element factory helpers (kept local so no framework is involved). */
function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function modeOption(label: string, hint: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = CLASS.popoverOption
  const labelEl = el('span', CLASS.popoverOptionLabel, label)
  const hintEl = el('span', CLASS.popoverOptionHint, hint)
  button.append(labelEl, hintEl)
  button.addEventListener('click', onClick)
  return button
}

/**
 * The enabled, focusable buttons of the current popover step, in DOM order.
 * The ghost back button is deliberately excluded: it is Esc-only (never in
 * the ↑/↓ cycle).
 */
function focusableButtons(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
    .filter(button => !button.disabled && !button.classList.contains(CLASS.popoverGhost))
}

/** Focus the first enabled button of the current step (no-op when none). */
function focusFirst(root: HTMLElement): void {
  focusableButtons(root)[0]?.focus()
}

/** Move focus across the step's buttons, wrapping around at the ends. */
function moveFocus(root: HTMLElement, dir: 1 | -1): void {
  const buttons = focusableButtons(root)
  if (buttons.length === 0) return
  const active = document.activeElement
  const index = active instanceof HTMLButtonElement ? buttons.indexOf(active) : -1
  const next = index === -1 ? (dir === 1 ? 0 : buttons.length - 1) : (index + dir + buttons.length) % buttons.length
  buttons[next]?.focus()
}

/**
 * Consume an ↑/↓ press as one focus step; both popover variants share it.
 * @returns whether the key was the focus cycle's.
 */
function moveFocusByKey(root: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return false
  event.preventDefault()
  event.stopPropagation()
  moveFocus(root, event.key === 'ArrowDown' ? 1 : -1)
  return true
}

/** The narrowed popover identity (guarded before the mode flow). */
interface DurablePopoverOptions {
  readonly session: SessionFace
  readonly seq: number
  readonly time: number
  readonly preview: string
  readonly anchor: HTMLElement
  readonly t: Translate
  readonly onRewind: (mode: 'chat' | 'both') => void
}

/**
 * Render the impact step: show the impact outcome, then confirm/back.
 * Reuses the outcome already fetched when the popover opened — running the
 * probe again here would repeat the disk comparison.
 */
function renderImpactStep(root: HTMLElement, opts: DurablePopoverOptions, back: () => void, recheck: () => void, cached?: PreviewOutcome): void {
  const { session, seq, t } = opts
  const impact = el('div', CLASS.popoverImpact, t('popover.impact.loading'))
  const actions = el('div', CLASS.popoverActions)
  const backButton = document.createElement('button')
  backButton.type = 'button'
  backButton.className = CLASS.popoverGhost
  backButton.textContent = t('popover.back')
  backButton.addEventListener('click', back)
  actions.append(backButton)

  const confirm = document.createElement('button')
  confirm.type = 'button'
  confirm.className = CLASS.popoverPrimary
  confirm.textContent = t('popover.confirm')
  confirm.disabled = true
  actions.append(confirm)
  root.replaceChildren(impact, actions)
  focusFirst(root)
  recheck()

  void (async () => {
    const outcome = cached ?? await previewImpact(session.sessionId, seq)
    if (outcome === null) {
      impact.textContent = t('popover.impact.failed', { message: 'preview request timed out' })
      return
    }
    if (outcome.kind === 'error') {
      impact.textContent = t('popover.impact.failed', { message: outcome.text })
      return
    }
    const restores = outcome.files.filter(file => file.action === 'restore').map(file => file.path)
    const deletes = outcome.files.filter(file => file.action === 'delete').map(file => file.path)
    if (restores.length === 0 && deletes.length === 0) {
      impact.textContent = t('popover.impact.none')
    } else {
      const lines = [
        ...restores.map(path => t('popover.impact.restore', { path })),
        ...deletes.map(path => t('popover.impact.delete', { path })),
      ]
      if (outcome.backupOff) {
        const list = document.createElement('div')
        list.textContent = lines.join('\n')
        impact.replaceChildren(list, el('div', CLASS.popoverNote, t('popover.backupDisabled')))
      } else {
        impact.textContent = lines.join('\n')
      }
    }
    confirm.disabled = false
    // The confirm is the step's only action; focus it as it becomes enabled
    // so a direct Enter confirms (native button activation).
    confirm.focus()
    confirm.addEventListener('click', () => {
      closePopover()
      opts.onRewind('both')
    })
  })().catch(() => {
    impact.textContent = t('popover.impact.failed', { message: 'unexpected error' })
  }).finally(() => { recheck() })
}

/**
 * One mounted popover shell: append, CSS-anchor placement, outside-click close,
 * and the capture-phase ↑/↓/Esc keys (Esc is delegated to the caller's handler
 * so the mode flow keeps its step-aware back/cancel behavior).
 */
interface PopoverShell {
  /** Re-check the anchor after a content render; CSS owns placement. */
  readonly recheck: () => void
  /** Remove the popover and its listeners (closePopover also does this). */
  readonly dispose: () => void
}

/**
 * Mount the popover chrome around `root`.
 *
 * Placement belongs to CSS Anchor Positioning: the trigger carries this
 * open's `anchor-name` and the panel names it in `position-anchor`, so the
 * browser keeps the panel tied to the trigger through scrolling, zooming,
 * resizing and content reflow. The shell only owns dismissal and the
 * anchor-name lifecycle.
 */
function mountShell(root: HTMLElement, anchor: HTMLElement, onKeyDown: (event: KeyboardEvent) => void, placement: 'above' | 'below' = 'above'): PopoverShell {
  if (placement === 'below') root.classList.add(CLASS.popoverBelow)
  const anchorName = `--dsh-rewind-popover-${++anchorSequence}`
  const previousAnchorName = anchor.style.getPropertyValue('anchor-name')
  const previousPriority = anchor.style.getPropertyPriority('anchor-name')
  const previousList = previousAnchorName.trim()
  const ownAnchorName = previousList === '' || previousList === 'none'
    ? anchorName
    : `${previousList} ${anchorName}`
  anchor.style.setProperty('anchor-name', ownAnchorName)
  root.style.setProperty('position-anchor', anchorName)
  const recheckPlacement = guardPlacement(root, anchor, placement)

  /** Re-check the anchor after a content render; CSS owns placement. */
  const recheck = (): void => {
    if (!root.isConnected) return
    if (!anchor.isConnected && popoverEl === root) closePopover()
    recheckPlacement()
  }

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null
    if (root.contains(target) || anchor.contains(target)) return
    closePopover()
  }
  // Capture phase on document: fires before the harness's React handlers, so
  // ↑/↓/Esc are stolen from the composer while the popover is open (ArrowUp
  // is input-history recall). Enter needs no handling: a focused button
  // activates natively.
  const deferred = setTimeout(() => {
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
  }, 0)

  document.body.append(root)
  recheck()

  const dispose = (): void => {
    clearTimeout(deferred)
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('keydown', onKeyDown, true)
    if (anchor.style.getPropertyValue('anchor-name') === ownAnchorName) {
      anchor.style.setProperty('anchor-name', previousAnchorName, previousPriority)
    }
  }
  return { recheck, dispose }
}

/**
 * Open the pending-retract popover: a single-confirm dialog for one pre-sent
 * steering message. No mode selection and no impact preview — the message has
 * never been processed, so there are no files to restore and nothing to choose.
 * Confirm closes the popover and hands off to `onRetract` (the queue removal +
 * composer refill in retract.ts).
 */
function openRetractPopover(opts: PopoverOptions): void {
  const { preview, anchor, t, retract, onRetract } = opts
  if (retract === undefined || onRetract === undefined) return
  markOpen(anchor)

  const root = el('div', CLASS.popover)
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-label', t('popover.retract.title'))

  const onKeyDown = (event: KeyboardEvent): void => {
    if (moveFocusByKey(root, event)) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closePopover()
    }
  }

  const previewText = preview.length > 0 ? preview : t('popover.noText')
  const actions = el('div', CLASS.popoverActions)
  const confirm = document.createElement('button')
  confirm.type = 'button'
  confirm.className = CLASS.popoverPrimary
  confirm.textContent = t('popover.confirm')
  confirm.addEventListener('click', () => {
    closePopover()
    onRetract()
  })
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = CLASS.popoverGhost
  cancel.textContent = t('popover.cancel')
  cancel.addEventListener('click', closePopover)
  actions.append(confirm, cancel)
  root.replaceChildren(
    el('div', CLASS.popoverTitle, t('popover.retract.title')),
    el('div', CLASS.popoverTarget, t('popover.retract.target', { preview: previewText })),
    el('div', CLASS.popoverImpact, t('popover.retract.hint')),
    actions,
  )

  const shell = mountShell(root, anchor, onKeyDown, opts.placement ?? 'above')
  popoverEl = root
  disposeOutside = shell.dispose
  focusFirst(root)
}

/** Open the mode-selection popover anchored near the given anchor. */
export function openPopover(opts: PopoverOptions): void {
  closePopover()
  liveSessionId = opts.session.sessionId
  // Pending retract variant: a single-confirm dialog, no rewind modes.
  if (opts.retract !== undefined) {
    openRetractPopover(opts)
    return
  }
  const { session, seq, time, preview, anchor, t } = opts
  const onRewind = opts.onRewind
  if (seq === undefined || time === undefined || onRewind === undefined) return
  markOpen(anchor)
  const durableOpts: DurablePopoverOptions = { session, seq, time, preview, anchor, t, onRewind }

  const root = el('div', CLASS.popover)
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-label', t('popover.title'))

  /** Availability of the "rewind conversation and files" mode, resolved from a preview. */
  type BothState =
    | { state: 'loading' }
    | { state: 'hasChanges' }
    | { state: 'noChanges' }
    | { state: 'error'; message: string }
  let bothState: BothState = { state: 'loading' }
  /** Impact outcome fetched at open; reused by the both-step. */
  let impactOutcome: PreviewOutcome = null

  /** Current step: Esc acts as cancel on the modes step, as back on impact. */
  let step: 'modes' | 'impact' = 'modes'
  /** Close if the anchor left the document; assigned once the shell mounts. */
  let recheck = (): void => {}

  const renderModes = (): void => {
    step = 'modes'
    const previewText = preview.length > 0 ? preview : t('popover.noText')
    const children: HTMLElement[] = [
      el('div', CLASS.popoverTitle, t('popover.title')),
      el('div', CLASS.popoverTarget, previewText),
      modeOption(t('popover.chat'), t('popover.chat.hint'), () => {
        closePopover()
        durableOpts.onRewind('chat')
      }),
    ]
    if (bothState.state === 'noChanges') {
      // Claude Code shows the code-restore options only when the checkpoint has
      // tracked file changes; a muted note keeps the layout stable.
      children.push(el('div', CLASS.popoverImpact, t('popover.noChanges')))
    } else if (bothState.state === 'error') {
      // The preview failed (e.g. the target was shadowed by compaction): show
      // the host's reason instead of hanging on "checking…" forever, and keep
      // the both-mode entry hidden — it can never succeed for an unreachable
      // target.
      children.push(el('div', CLASS.popoverImpact, t('popover.impact.failed', { message: bothState.message })))
    } else {
      const option = modeOption(
        t('popover.both'),
        bothState.state === 'loading' ? t('popover.checking') : t('popover.both.hint'),
        renderImpact,
      )
      if (bothState.state === 'loading') option.disabled = true
      children.push(option)
    }
    root.replaceChildren(...children)
    focusFirst(root)
    recheck()
  }

  /** Move to the impact step (its back/Esc returns to the modes step). */
  const renderImpact = (): void => {
    step = 'impact'
    renderImpactStep(root, durableOpts, renderModes, recheck, impactOutcome)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (moveFocusByKey(root, event)) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      // Esc is the keyboard twin of the step's ghost button: cancel on the
      // modes step, back on the impact step.
      if (step === 'impact') renderModes()
      else closePopover()
    }
  }

  renderModes()
  const shell = mountShell(root, anchor, onKeyDown, opts.placement ?? 'above')
  recheck = shell.recheck
  popoverEl = root
  disposeOutside = shell.dispose

  // Resolve "both" availability up front (Claude Code hides the code-restore
  // options when no tracked file changes exist). EVERY settled probe resolves
  // the modes step: success decides has/no changes, any failure (rejected
  // admission, unmatched line, never-settled wait) becomes the error state that
  // shows the reason and hides the entry — never a step stuck on "checking…".
  void (async () => {
    const outcome = await previewImpact(session.sessionId, seq)
    impactOutcome = outcome
    if (outcome !== null && outcome.kind === 'success') {
      bothState = { state: outcome.files.length > 0 ? 'hasChanges' : 'noChanges' }
    } else {
      // Surface the reason (host rejection — e.g. "no longer in the model
      // context (shadowed by compaction)" — or a never-settled wait) instead
      // of leaving the modes step stuck with a permanently disabled entry.
      bothState = { state: 'error', message: outcome?.kind === 'error' ? outcome.text : 'preview request timed out' }
    }
    renderModes()
  })().catch(() => {
    bothState = { state: 'error', message: 'unexpected error' }
    renderModes()
  })
}

/** Options for the edit-and-resend dialog: the whisper of a composer, per message. */
export interface EditPopoverOptions {
  readonly session: SessionFace
  /** The target user message seq. */
  readonly seq: number
  /** The target message time, epoch ms. */
  readonly time: number
  /** The message text the textarea opens with (the row's joined Copy text). */
  readonly preview: string
  /** The pencil button the dialog is positioned against. */
  readonly anchor: HTMLElement
  /** Preferred side of the anchor; defaults to below (the row sits above the composer). */
  readonly placement?: 'above' | 'below'
  readonly t: Translate
  /**
   * Withdraw from `seq` and send `text` (restoring files too when `withFiles`).
   * Resolves true once the edited text went out; false leaves the dialog open so
   * the user keeps the text they typed.
   */
  readonly onEdit: (text: string, withFiles: boolean) => Promise<boolean>
}

/** The restore glyph: a turn-back arrow, the same idea as the row's rewind action. */
const RESTORE_GLYPH = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
  + '<path d="M4.6 2.2 2.2 4.6l2.4 2.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />'
  + '<path d="M2.2 4.6h4.3a3 3 0 0 1 3 3v1.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" /></svg>'

/** The send glyph: an up arrow, the composition every chat composer already taught. */
const SEND_GLYPH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">'
  + '<path d="M7 11V3.4M3.4 6.9 7 3.3l3.6 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>'

/** The header mark: the same pencil the row action wears, at tile size. */
const MARK_GLYPH = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
  + '<path d="M9.6 3.1 12.9 6.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />'
  + '<path d="M3 13.1v-2.7l7.3-7.3a1.55 1.55 0 0 1 2.2 0l.4.4a1.55 1.55 0 0 1 0 2.2L5.6 13.1H3z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" /></svg>'

/** The notice glyph for the one line that explains what the action does. */
const INFO_GLYPH = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
  + '<circle cx="6" cy="6" r="4.6" stroke="currentColor" stroke-width="1.2" />'
  + '<path d="M6 5.4v2.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />'
  + '<circle cx="6" cy="3.7" r="0.65" fill="currentColor" /></svg>'

/** The file glyph for the impact row. */
const FILE_GLYPH = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
  + '<path d="M3 1.8h3.6L9 4.2v6H3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />'
  + '<path d="M6.4 1.9v2.4h2.4" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" /></svg>'

/** The close glyph (the dialog owns its own chrome; the row already says where). */
const CLOSE_GLYPH = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
  + '<path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>'

/** Greedy autosize between the panel's two height bounds. */
function autosize(input: HTMLTextAreaElement): void {
  input.style.height = 'auto'
  input.style.height = `${Math.min(240, Math.max(84, input.scrollHeight))}px`
}

/**
 * Open the edit-and-resend dialog: one textarea holding the target message, the
 * same two file scopes the rewind popover offers, and a primary that withdraws
 * every later turn and sends the edited text.
 *
 * The dialog stays mounted while the host works (the button reads as sending and
 * the fields lock): an edit is an authoring act, so a failure must never throw
 * away what the user typed.
 */
export function openEditPopover(opts: EditPopoverOptions): void {
  closePopover()
  const { session, seq, anchor, t, preview } = opts
  markOpen(anchor)
  liveSessionId = session.sessionId

  const root = el('div', `${CLASS.popover} ${CLASS.edit}`)
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-label', t('edit.title'))

  const header = el('div', CLASS.editHeader)
  const close = document.createElement('button')
  close.type = 'button'
  close.className = CLASS.editClose
  close.setAttribute('aria-label', t('popover.cancel'))
  close.innerHTML = CLOSE_GLYPH
  close.addEventListener('click', () => closePopover())
  // The message's own clock reads as context, the way a quoted reply carries it;
  // it also tells a user editing an older row which one they opened.
  const clock = new Date(opts.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const mark = el('span', CLASS.editMark)
  mark.innerHTML = MARK_GLYPH
  header.append(
    mark,
    el('div', CLASS.popoverTitle, t('edit.title')),
    el('span', CLASS.editTime, clock),
    close,
  )

  const hint = el('div', CLASS.editNote)
  hint.innerHTML = INFO_GLYPH
  hint.append(el('span', '', t('edit.hint')))

  // The field: one filled well holding the composer text, so the caret has a
  // surface without the panel wearing a border anywhere.
  const field = el('div', CLASS.editField)
  const input = document.createElement('textarea')
  input.className = CLASS.editInput
  input.value = preview
  input.rows = 3
  input.spellcheck = false
  input.setAttribute('aria-label', t('edit.title'))
  input.addEventListener('input', () => autosize(input))
  field.append(input)

  // File restore: a chip in the composer's own toolbar, the way a composer
  // carries its tools. It only appears once the preview reports something
  // restorable — a control that cannot be turned on is decoration.
  let withFiles = false
  const fileSwitch = document.createElement('button')
  fileSwitch.type = 'button'
  fileSwitch.className = CLASS.editSwitch
  fileSwitch.setAttribute('role', 'switch')
  fileSwitch.setAttribute('aria-checked', 'false')
  fileSwitch.setAttribute('aria-label', t('edit.files.toggle'))
  fileSwitch.hidden = true
  fileSwitch.innerHTML = RESTORE_GLYPH
  const fileSwitchLabel = document.createElement('span')
  fileSwitchLabel.textContent = t('edit.scope.both')
  const fileSwitchCount = document.createElement('span')
  fileSwitchCount.className = CLASS.editSwitchCount
  fileSwitch.append(fileSwitchLabel, fileSwitchCount)
  fileSwitch.addEventListener('click', () => {
    withFiles = !withFiles
    fileSwitch.setAttribute('aria-checked', String(withFiles))
  })

  const files = document.createElement('details')
  files.className = CLASS.editFiles
  const filesSummary = document.createElement('summary')
  filesSummary.innerHTML = FILE_GLYPH
  const filesSummaryText = el('span', '', t('edit.files.loading'))
  filesSummary.append(filesSummaryText)
  files.append(filesSummary)
  const fileList = document.createElement('ul')
  fileList.className = CLASS.editFileList

  const error = el('div', CLASS.editError)
  error.hidden = true

  // Footer: the chat-composer shape — a quiet cancel, then the send itself as a
  // round primary the eye lands on.
  const bar = el('div', CLASS.editBar)
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = CLASS.popoverGhost
  cancel.textContent = t('popover.cancel')
  cancel.addEventListener('click', () => closePopover())
  const submit = document.createElement('button')
  submit.type = 'button'
  submit.className = `${CLASS.popoverPrimary} ${CLASS.editSend}`
  submit.setAttribute('aria-label', t('edit.submit'))
  submit.setAttribute('title', t('edit.submit'))
  submit.innerHTML = SEND_GLYPH
  const chord = el('span', CLASS.editKbd, /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ ⏎' : 'Ctrl ⏎')
  chord.setAttribute('aria-hidden', 'true')
  bar.append(fileSwitch, el('div', CLASS.editSpacer), chord, cancel, submit)

  root.append(header, hint, field, files, error, bar)


  /** Lock or unlock the dialog while one submit is in flight. */
  const busy = (sending: boolean): void => {
    input.readOnly = sending
    close.disabled = sending
    cancel.disabled = sending
    fileSwitch.disabled = sending
    submit.disabled = sending
    submit.setAttribute('aria-busy', String(sending))
    submit.setAttribute('aria-label', sending ? t('edit.sending') : t('edit.submit'))
  }

  /** Surface one refusal above the footer without closing the dialog. */
  const refuse = (text: string): void => {
    error.textContent = text
    error.hidden = false
  }

  let sending = false
  const doSubmit = (): void => {
    if (sending) return
    const text = input.value.trim()
    if (text === '') {
      refuse(t('edit.empty'))
      input.focus()
      return
    }
    error.hidden = true
    sending = true
    busy(true)
    void opts.onEdit(text, withFiles).then(sent => {
      if (sent) {
        closePopover()
        return
      }
      sending = false
      busy(false)
      refuse(t('edit.sendFailed'))
    }).catch(() => {
      sending = false
      busy(false)
      refuse(t('edit.sendFailed'))
    })
  }
  submit.addEventListener('click', doSubmit)

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closePopover()
      return
    }
    // Enter is a newline here; the send chord is the dialog's own accelerator.
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      doSubmit()
    }
  }

  const shell = mountShell(root, anchor, onKeyDown, opts.placement ?? 'below')
  popoverEl = root
  disposeOutside = shell.dispose
  input.focus()
  input.setSelectionRange(input.value.length, input.value.length)
  autosize(input)

  // Resolve the file scope from the same host preview the rewind popover uses.
  void (async () => {
    const outcome = await previewImpact(session.sessionId, seq)
    if (!root.isConnected) return
    if (outcome === null) {
      filesSummaryText.textContent = t('edit.files.failed', { message: 'preview request timed out' })
      return
    }
    if (outcome.kind === 'error') {
      filesSummaryText.textContent = t('edit.files.failed', { message: outcome.text })
      return
    }
    if (outcome.files.length === 0) {
      filesSummaryText.textContent = t('edit.files.none')
      return
    }
    filesSummaryText.textContent = t('edit.files.count', { count: outcome.files.length })
    fileList.replaceChildren(...outcome.files.map((file) => {
      const row = el('li', '')
      row.append(
        el('span', CLASS.editFilePath, file.path),
        el('span', CLASS.editFileTag, file.action === 'restore' ? t('edit.tag.restore') : t('edit.tag.delete')),
      )
      return row
    }))
    files.append(fileList)
    if (outcome.backupOff) files.append(el('div', CLASS.popoverNote, t('popover.backupDisabled')))
    fileSwitch.hidden = false
    fileSwitchCount.textContent = String(outcome.files.length)
  })().catch(() => {
    if (root.isConnected) filesSummaryText.textContent = t('edit.files.failed', { message: 'unexpected error' })
  })
}
