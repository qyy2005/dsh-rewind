/**
 * The ↶ action button: the one message-action control this plugin renders.
 *
 * The A2 mount injects it as a React child of a durable row's actions row; the
 * pending layer (`pending-mount.tsx`) portals the same button, with the retract
 * copy and a marker, into an unclaimed steering bubble.
 *
 * The action only records intent: a click opens the popover variant, which
 * confirms and runs the host command / queue mutation (see `popover.ts`,
 * `rewind-flow.ts`, `retract.ts`); the host's admission stays the authority.
 *
 * @module dsh-rewind/client/action
 */

import type { ReactNode } from 'react'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { RewindKey } from './locales.ts'
import type { RowAction, RowActionRenderer } from './mount.tsx'
import { CLASS } from './styles.ts'

type Translate = (key: RewindKey, params?: Record<string, unknown>) => string

/**
 * The ↶ glyph, drawn inline because the product icon set has no rewind
 * artwork. It renders at the row's glyph scale (the neighbouring Copy/branch
 * icons are 15px) with a 1.25 stroke; at 1 the single open stroke reads thinner
 * than their dense outlines.
 */
const ICON = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6.5 2.5 2.5 6.5l4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 6.5h7a4 4 0 0 1 4 4v1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
)

/** The shared button's inputs. */
export interface RewindActionButtonProps {
  readonly t: Translate
  /** Dictionary keys of the tooltip and the aria label. */
  readonly titleKey: RewindKey
  readonly ariaKey: RewindKey
  /** Mark the pre-admission variant: the pending layer uses it to skip its own button. */
  readonly pending?: boolean
  /** Open the action's popover variant, anchored at the button. */
  readonly onOpen: (anchor: HTMLElement) => void
}

/** The row's action chrome, matching the official Copy/branch buttons. */
export function RewindActionButton({ t, titleKey, ariaKey, pending = false, onOpen }: RewindActionButtonProps): ReactNode {
  return (
    <Tooltip label={t(titleKey)} side="bottom">
      <button
        type="button"
        className={CLASS.action}
        aria-label={t(ariaKey)}
        aria-haspopup="dialog"
        data-pending-retract={pending || undefined}
        onClick={event => {
          event.stopPropagation()
          onOpen(event.currentTarget)
        }}
      >
        {ICON}
      </button>
    </Tooltip>
  )
}

/** The pencil glyph, drawn inline to the row's 15px glyph scale and 1.25 stroke. */
const EDIT_ICON = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M9.6 3.1 12.9 6.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <path d="M3 13.1v-2.7l7.3-7.3a1.55 1.55 0 0 1 2.2 0l.4.4a1.55 1.55 0 0 1 0 2.2L5.6 13.1H3z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** The pencil action: opens the edit-and-resend dialog for one durable user row. */
export function EditActionButton({ t, onOpen }: { readonly t: Translate; readonly onOpen: (anchor: HTMLElement) => void }): ReactNode {
  return (
    <Tooltip label={t('edit.button.title')} side="bottom">
      <button
        type="button"
        className={CLASS.action}
        aria-label={t('edit.button.aria')}
        aria-haspopup="dialog"
        onClick={event => {
          event.stopPropagation()
          onOpen(event.currentTarget)
        }}
      >
        {EDIT_ICON}
      </button>
    </Tooltip>
  )
}

/**
 * Build the A2 mount's action renderer: one button per eligible row, nothing for
 * the rest.
 * @param t - the plugin's own translate function (the action's copy).
 * @param eligible - render-time gate: whether a row's session may offer a rewind at all.
 * @param open - opens the mode popover for one row, anchored at the button.
 * @param openEdit - opens the edit-and-resend dialog for a durable `user` row;
 *   omitted by the tests and any caller that only wants the rewind affordance.
 * @returns the renderer the mount calls for every user/steering row.
 */
export function rewindActionRenderer(
  t: Translate,
  eligible: (sessionId: string) => boolean,
  open: (row: RowAction, anchor: HTMLElement) => void,
  openEdit?: (row: RowAction, anchor: HTMLElement) => void,
): RowActionRenderer {
  return row => {
    if (!eligible(row.sessionId)) return null
    const rewind = (
      <RewindActionButton
        t={t}
        titleKey="button.title"
        ariaKey="button.aria"
        onOpen={anchor => open(row, anchor)}
      />
    )
    // The rewind keeps its exact seat; the pencil follows it, and only a durable
    // `user` row gets one (a steering row is not an editable message).
    if (openEdit === undefined || row.kind !== 'user') return rewind
    return (
      <>
        {rewind}
        <EditActionButton t={t} onOpen={anchor => openEdit(row, anchor)} />
      </>
    )
  }
}
