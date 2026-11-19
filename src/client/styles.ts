/**
 * Client plugin styling: one injected `<style>` tag (scoped class names),
 * following the dsh design tokens (`--dsw-*`) so the per-message action, the
 * mode popover, the failure toast and the settings card blend with the
 * conversation chrome.
 *
 * @module dsh-rewind/client/styles
 */

/** Class names shared between the injected DOM and the stylesheet. */
export const CLASS = {
  action: 'dsh-rewind-action',
  popover: 'dsh-rewind-popover',
  popoverBelow: 'dsh-rewind-popover-below',
  popoverTitle: 'dsh-rewind-popover-title',
  popoverTarget: 'dsh-rewind-popover-target',
  popoverOption: 'dsh-rewind-popover-option',
  popoverOptionLabel: 'dsh-rewind-popover-option-label',
  popoverOptionHint: 'dsh-rewind-popover-option-hint',
  popoverImpact: 'dsh-rewind-popover-impact',
  popoverNote: 'dsh-rewind-popover-note',
  popoverActions: 'dsh-rewind-popover-actions',
  popoverPrimary: 'dsh-rewind-popover-primary',
  popoverGhost: 'dsh-rewind-popover-ghost',
  guardHint: 'dsh-rewind-guard-hint',
  edit: 'dsh-rewind-edit',
  editHeader: 'dsh-rewind-edit-header',
  editTime: 'dsh-rewind-edit-time',
  editMark: 'dsh-rewind-edit-mark',
  editClose: 'dsh-rewind-edit-close',
  editQuote: 'dsh-rewind-edit-quote',
  editInput: 'dsh-rewind-edit-input',
  editSwitch: 'dsh-rewind-edit-switch',
  editSwitchCount: 'dsh-rewind-edit-switch-count',
  editField: 'dsh-rewind-edit-field',
  editBar: 'dsh-rewind-edit-bar',
  editSpacer: 'dsh-rewind-edit-spacer',
  editSend: 'dsh-rewind-edit-send',
  editFiles: 'dsh-rewind-edit-files',
  editFilePath: 'dsh-rewind-edit-file-path',
  editFileTag: 'dsh-rewind-edit-file-tag',
  editKbd: 'dsh-rewind-edit-kbd',
  editFileList: 'dsh-rewind-edit-file-list',
  editFoot: 'dsh-rewind-edit-foot',
  editNote: 'dsh-rewind-edit-note',
  editError: 'dsh-rewind-edit-error',
} as const

/** One injected stylesheet (scoped under `.dsh-rewind-*`). */
export const STYLE = `
/* The official action chrome, value for value: the action is Copy's peer in the
   same 28px row, so a different box, glyph scale, or resting tier would read as
   a different kind of control. */
.dsh-rewind-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(28px + var(--dsh-content-font-delta, 0px));
  height: calc(28px + var(--dsh-content-font-delta, 0px));
  padding: 6px;
  border: none;
  border-radius: var(--dsw-radius-sm, 8px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsh-rewind-action svg {
  width: calc(15px + var(--dsh-content-font-delta, 0px));
  height: calc(15px + var(--dsh-content-font-delta, 0px));
}
@media (hover: hover) {
  .dsh-rewind-action:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-secondary);
  }
}
.dsh-rewind-popover {
  position: fixed;
  z-index: 1100;
  box-sizing: border-box;
  /* Keep the plugin's 300px panel width while using the official anchor
     sizing model; max-content lets long impact paths size up to that cap. */
  width: max-content;
  min-width: min(300px, calc(100vw - 24px));
  max-width: min(300px, calc(100vw - 24px));
  padding: 16px;
  border: 0;
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3));
  backdrop-filter: var(--dsw-menu-backdrop-filter);
  isolation: isolate;
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  /* Elevated surface: match the menu cards' l2 scrollbar tokens. */
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
  box-shadow: var(--dsw-elevation-prominent);
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-primary);
  max-height: calc(100dvh - 12px - max(12px, var(--dsh-frame-overlay-top, 12px)));
  overflow-x: hidden;
  overflow-y: auto;
  position-area: none;
  top: max(12px, var(--dsh-frame-overlay-top, 12px));
  bottom: max(12px, calc(anchor(top) + 4px));
  left: max(12px, anchor(left));
  right: 12px;
  position-try-fallbacks: --dsh-rewind-window, --dsh-rewind-opposite, --dsh-rewind-wide-opposite, --dsh-rewind-tall, --dsh-rewind-viewport;
  align-self: end;
  justify-self: start;
  height: fit-content;
  min-height: 0;
  margin: 0;
}
/* Below-first mirror of the official fallback order: same-side wide, opposite
   anchored, opposite wide (the official window rule), tall, viewport. */
.dsh-rewind-popover.dsh-rewind-popover-below {
  top: max(12px, calc(anchor(bottom) + 4px));
  bottom: 12px;
  align-self: start;
  position-try-fallbacks: --dsh-rewind-below-window, --dsh-rewind-below-opposite, --dsh-rewind-window, --dsh-rewind-tall, --dsh-rewind-viewport;
}
@position-try --dsh-rewind-below-window {
  position-area: none;
  top: max(12px, calc(anchor(bottom) + 4px));
  bottom: 12px;
  left: 12px;
  right: 12px;
  margin: 0;
  align-self: start;
  justify-self: safe end;
}
@position-try --dsh-rewind-below-opposite {
  top: max(12px, var(--dsh-frame-overlay-top, 12px));
  bottom: max(12px, calc(anchor(top) + 4px));
  align-self: end;
}
@position-try --dsh-rewind-window {
  position-area: none;
  top: max(12px, var(--dsh-frame-overlay-top, 12px));
  bottom: max(12px, calc(anchor(top) + 4px));
  left: 12px;
  right: 12px;
  margin: 0;
  align-self: safe end;
  justify-self: safe end;
}
@position-try --dsh-rewind-opposite {
  top: max(12px, calc(anchor(bottom) + 4px));
  bottom: 12px;
  align-self: start;
}
@position-try --dsh-rewind-wide-opposite {
  top: max(12px, calc(anchor(bottom) + 4px));
  bottom: 12px;
  left: 12px;
  right: 12px;
  align-self: start;
  justify-self: safe end;
}
@position-try --dsh-rewind-tall {
  position-area: none;
  top: max(12px, var(--dsh-frame-overlay-top, 12px));
  bottom: 12px;
  left: max(12px, anchor(left));
  right: 12px;
  margin: 0;
  align-self: safe start;
  justify-self: start;
}
@position-try --dsh-rewind-viewport {
  position-area: none;
  inset: max(12px, var(--dsh-frame-overlay-top, 12px)) 12px 12px;
  margin: 0;
  align-self: safe start;
  justify-self: safe end;
}
.dsh-rewind-popover-title {
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.dsh-rewind-popover-target {
  margin: 2px 0 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
  word-break: break-all;
  /* The full message sits above the popover; two lines are enough context. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.dsh-rewind-popover-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  margin: 0 0 2px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.dsh-rewind-popover-option:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
/* Arrow navigation moves real focus, so the focused row carries the pointer's
   fill and the browser ring is suppressed: in dark mode the UA two-tone ring
   draws its dark half against the filled row and reads as a residue edge (the
   harness Menu suppresses it the same way). */
.dsh-rewind-popover-option:focus-visible:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
  outline: none;
}
.dsh-rewind-popover-option:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh-rewind-popover-option-label {
  font-weight: 500;
}
.dsh-rewind-popover-option-hint {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-popover-impact {
  margin: 4px 0 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg-hover);
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap;
  max-height: 160px;
  overflow: auto;
}
.dsh-rewind-popover-note {
  margin-top: 6px;
  font-size: 11px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.dsh-rewind-popover-primary,
.dsh-rewind-popover-ghost {
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  font: inherit;
  cursor: pointer;
}
.dsh-rewind-popover-primary {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}
.dsh-rewind-popover-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover);
}
.dsh-rewind-popover-primary:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh-rewind-popover-ghost {
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}
.dsh-rewind-popover-ghost:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-rewind-popover-ghost:active {
  background: var(--dsw-alias-interactive-bg-active);
}

/* ---- Edit-and-resend composer ----
   Composed like a chat composer rather than a form: the panel is the card, the
   text sits in one filled well, and the tools ride a toolbar inside the same
   surface with a round send as the only primary. Surfaces are separated by a
   tone step; the only line is the focus ring that says where the caret is. */
.dsh-rewind-popover.dsh-rewind-edit {
  min-width: min(460px, calc(100vw - 24px));
  max-width: min(460px, calc(100vw - 24px));
  padding: 16px 16px 14px;
  border-radius: 16px;
}
/* The dialog opens downward from the pencil, so the transform origin sits on
   that corner and the panel appears to unfold out of the button. The curve
   starts fast and lands soft (no bounce): a pop reads as a glitch, a spring
   reads as a toy. */
.dsh-rewind-popover.dsh-rewind-edit {
  transform-origin: bottom right;
}
.dsh-rewind-popover.dsh-rewind-edit.dsh-rewind-popover-below {
  transform-origin: top right;
}
@media (prefers-reduced-motion: no-preference) {
  .dsh-rewind-popover.dsh-rewind-edit {
    animation: dsh-rewind-edit-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}
@keyframes dsh-rewind-edit-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
  }
  60% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.dsh-rewind-edit-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh-rewind-edit-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  margin-right: 2px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  color: var(--dsw-alias-label-secondary);
}
.dsh-rewind-edit-header .dsh-rewind-popover-title {
  font-size: 15px;
  flex: 1;
  min-width: 0;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: -0.02em;
}
.dsh-rewind-edit-time {
  margin-right: 2px;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dsh-rewind-edit-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.dsh-rewind-edit-close:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dsh-rewind-edit-close:focus-visible {
  outline: 2px solid var(--dsw-alias-button-primary-fill);
  outline-offset: 1px;
}
.dsh-rewind-edit-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-edit-note svg {
  flex: none;
  margin-top: 2px;
}
.dsh-rewind-edit-field {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
  transition: background 130ms ease, box-shadow 130ms ease;
}
.dsh-rewind-edit-field:focus-within {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--dsw-alias-button-primary-fill) 55%, transparent);
}
.dsh-rewind-edit-input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: 72px;
  max-height: 260px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  caret-color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  resize: none;
  outline: none;
}
.dsh-rewind-edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.dsh-rewind-edit-spacer {
  flex: 1;
}
.dsh-rewind-edit-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px 0 8px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 11.5px;
  line-height: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease;
}
.dsh-rewind-edit-switch:hover:not([aria-checked='true']) {
  color: var(--dsw-alias-label-primary);
}
.dsh-rewind-edit-switch[aria-checked='true'] {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 13%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-rewind-edit-switch[aria-checked='true'] svg {
  color: var(--dsw-alias-label-primary);
}
.dsh-rewind-edit-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-button-primary-fill);
  outline-offset: 2px;
}
.dsh-rewind-edit-switch:disabled {
  opacity: 0.45;
  cursor: default;
}
.dsh-rewind-edit-switch svg {
  width: 12px;
  height: 12px;
  flex: none;
}
.dsh-rewind-edit-switch-count {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);
  font-size: 10.5px;
  line-height: 16px;
  text-align: center;
}
.dsh-rewind-edit-switch-count:empty {
  display: none;
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-popover-ghost {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-edit-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
  transition: background 130ms ease, transform 120ms ease, opacity 120ms ease;
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-edit-send:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover);
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-edit-send:active:not(:disabled) {
  transform: scale(0.94);
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-edit-send:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh-rewind-popover.dsh-rewind-edit .dsh-rewind-edit-send:focus-visible {
  outline: 2px solid var(--dsw-alias-button-primary-fill);
  outline-offset: 2px;
}
.dsh-rewind-edit-files {
  margin-top: 10px;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-edit-files > summary svg {
  flex: none;
}
.dsh-rewind-edit-files > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: 100%;
  padding: 2px 0;
  list-style: none;
  cursor: pointer;
}
.dsh-rewind-edit-files > summary::-webkit-details-marker {
  display: none;
}
.dsh-rewind-edit-files > summary::before {
  content: '';
  flex: none;
  width: 5px;
  height: 5px;
  margin-left: 2px;
  border-right: 1.4px solid currentColor;
  border-bottom: 1.4px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 120ms ease;
}
.dsh-rewind-edit-files[open] > summary::before {
  transform: rotate(45deg);
}
.dsh-rewind-edit-file-list {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);
  max-height: 132px;
  overflow: auto;
  list-style: none;
}
.dsh-rewind-edit-file-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  color: var(--dsw-alias-label-secondary);
}
.dsh-rewind-edit-file-path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}
.dsh-rewind-edit-file-tag {
  flex: none;
  height: 16px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  font-size: 10.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-edit-kbd {
  margin-right: 4px;
  font-size: 10.5px;
  line-height: 16px;
  letter-spacing: 0.02em;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
}
.dsh-rewind-edit-error {
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-danger, #e5484d);
}

.dsh-rewind-guard-hint {
  position: fixed;
  z-index: 1000;
  max-width: min(440px, calc(100vw - 24px));
  padding: 8px 12px;
  border: 0;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3));
  backdrop-filter: var(--dsw-menu-backdrop-filter);
  isolation: isolate;
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-panel);
  font-size: 13px;
  line-height: 18px;
  color: var(--dsw-alias-label-primary);
  pointer-events: none;
}

/* ---- Plugin configuration form ---- */
/* Only the card's own controls: the two switch rows, their hints, and the divider. */
.dsh-rewind-settings-divider {
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsh-rewind-settings-section {
  display: grid;
  gap: 6px;
  padding: 12px 0;
}
.dsh-rewind-settings-toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dsh-rewind-settings-toggle-label {
  flex: 1;
  min-width: 0;
}
.dsh-rewind-settings-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
`
