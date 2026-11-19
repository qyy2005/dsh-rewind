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
  editClose: 'dsh-rewind-edit-close',
  editQuote: 'dsh-rewind-edit-quote',
  editInput: 'dsh-rewind-edit-input',
  editScopes: 'dsh-rewind-edit-scopes',
  editScope: 'dsh-rewind-edit-scope',
  editFiles: 'dsh-rewind-edit-files',
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

/* ---- Edit-and-resend dialog ----
   A composing surface rather than a choice list, so the panel is wider than the
   rewind popover and the input, not the title, owns the top of the eye path. */
.dsh-rewind-popover.dsh-rewind-edit {
  min-width: min(420px, calc(100vw - 24px));
  max-width: min(420px, calc(100vw - 24px));
  padding: 14px;
}
.dsh-rewind-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
  border-radius: 6px;
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
.dsh-rewind-edit-input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: 84px;
  max-height: 240px;
  margin: 8px 0 10px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  line-height: 20px;
  resize: none;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
}
.dsh-rewind-edit-input:focus {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-button-primary-fill) 55%, var(--dsw-alias-border-l1));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-button-primary-fill) 18%, transparent);
}
.dsh-rewind-edit-input::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-edit-scopes {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
}
.dsh-rewind-edit-scope {
  flex: 1;
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
}
.dsh-rewind-edit-scope:hover:not([aria-pressed='true']) {
  color: var(--dsw-alias-label-secondary);
}
.dsh-rewind-edit-scope[aria-pressed='true'] {
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3));
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.16), inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
}
.dsh-rewind-edit-scope:focus-visible {
  outline: 2px solid var(--dsw-alias-button-primary-fill);
  outline-offset: 1px;
}
.dsh-rewind-edit-scope:disabled {
  opacity: 0.45;
  cursor: default;
}
.dsh-rewind-edit-files {
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
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
  margin: 6px 0 0;
  padding: 6px 0 0 13px;
  border-top: 1px solid var(--dsw-alias-border-l2);
  max-height: 132px;
  overflow: auto;
  list-style: none;
}
.dsh-rewind-edit-file-list li {
  display: flex;
  gap: 6px;
  padding: 1px 0;
  color: var(--dsw-alias-label-secondary);
  word-break: break-all;
}
.dsh-rewind-edit-note {
  margin-top: 10px;
  font-size: 11px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-rewind-edit-error {
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-danger, #e5484d);
}
.dsh-rewind-edit .dsh-rewind-popover-actions {
  margin-top: 12px;
}
.dsh-rewind-edit .dsh-rewind-popover-primary {
  min-width: 88px;
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
