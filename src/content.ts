import { eventToShortcut, normalizeShortcut } from "./lib/shortcuts";
import extApi from "./lib/ext-api";
import { getActiveProfile, readState, subscribeState } from "./lib/storage";
import type { QuickFillState } from "./lib/types";

type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const INPUT_TYPES_TO_SKIP = new Set([
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "file",
  "hidden",
  "image",
  "month",
  "radio",
  "range",
  "reset",
  "submit",
  "time",
  "week",
]);

let stateCache: QuickFillState | null = null;
let lastEditableElement: EditableElement | null = null;

function normalizeAlias(input: string): string {
  return input.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getDeepActiveElement(root: Document | ShadowRoot): Element | null {
  const active = root.activeElement;
  if (!active) {
    return null;
  }

  if (active instanceof HTMLElement && active.shadowRoot) {
    return getDeepActiveElement(active.shadowRoot) ?? active;
  }

  return active;
}

function toEditableElement(element: Element | null): EditableElement | null {
  if (!element) {
    return null;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element;
  }

  if (element instanceof HTMLInputElement) {
    return INPUT_TYPES_TO_SKIP.has(element.type) ? null : element;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return element;
  }

  return null;
}

function getEditableElement(): EditableElement | null {
  const active = getDeepActiveElement(document);
  return toEditableElement(active);
}

function getInsertTarget(): EditableElement | null {
  const active = getEditableElement();
  if (active) {
    lastEditableElement = active;
    return active;
  }

  if (lastEditableElement && lastEditableElement.isConnected) {
    return lastEditableElement;
  }

  return null;
}

function dispatchInputEvents(target: EditableElement, value: string): void {
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));

  if (target instanceof HTMLElement && target.isContentEditable) {
    target.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: value,
        inputType: "insertText",
      }),
    );
  }
}

function insertIntoContentEditable(target: HTMLElement, value: string): void {
  target.focus();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.textContent = `${target.textContent ?? ""}${value}`;
    dispatchInputEvents(target, value);
    return;
  }

  const range = selection.getRangeAt(0);
  if (!target.contains(range.commonAncestorContainer)) {
    target.textContent = `${target.textContent ?? ""}${value}`;
    dispatchInputEvents(target, value);
    return;
  }

  range.deleteContents();
  const textNode = document.createTextNode(value);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  dispatchInputEvents(target, value);
}

function insertIntoFocusedField(value: string): boolean {
  const target = getInsertTarget();
  if (!target) {
    return false;
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.focus();
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText(value, start, end, "end");
    dispatchInputEvents(target, value);
    return true;
  }

  insertIntoContentEditable(target, value);
  return true;
}

function findValueByAlias(alias: string): string | null {
  if (!stateCache) {
    return null;
  }

  const normalized = normalizeAlias(alias);
  if (!normalized) {
    return null;
  }

  const activeProfile = getActiveProfile(stateCache);
  const match = activeProfile.items.find(
    (item) =>
      normalizeAlias(item.alias) === normalized && item.value.trim().length > 0,
  );

  return match ? match.value : null;
}

function replaceAliasInInput(target: HTMLInputElement | HTMLTextAreaElement): boolean {
  const caret = target.selectionStart;
  if (caret === null) {
    return false;
  }

  const beforeCaret = target.value.slice(0, caret);
  const aliasMatch = beforeCaret.match(/([a-zA-Z0-9_-]+)$/);
  if (!aliasMatch) {
    return false;
  }

  const alias = aliasMatch[1];
  const value = findValueByAlias(alias);
  if (!value) {
    return false;
  }

  const start = caret - alias.length;
  target.setRangeText(value, start, caret, "end");
  dispatchInputEvents(target, value);
  return true;
}

function replaceAliasInContentEditable(target: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  if (!range.collapsed) {
    return false;
  }

  const container = range.startContainer;
  if (!(container instanceof Text)) {
    return false;
  }

  const beforeCaret = container.data.slice(0, range.startOffset);
  const aliasMatch = beforeCaret.match(/([a-zA-Z0-9_-]+)$/);
  if (!aliasMatch) {
    return false;
  }

  const alias = aliasMatch[1];
  const value = findValueByAlias(alias);
  if (!value) {
    return false;
  }

  const start = range.startOffset - alias.length;
  container.deleteData(start, alias.length);
  container.insertData(start, value);

  const nextOffset = start + value.length;
  const nextRange = document.createRange();
  nextRange.setStart(container, nextOffset);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  dispatchInputEvents(target, value);
  return true;
}

function handleAliasTabCompletion(event: KeyboardEvent): void {
  if (
    event.defaultPrevented ||
    event.key !== "Tab" ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey
  ) {
    return;
  }

  const target = getEditableElement();
  if (!target) {
    return;
  }

  let replaced = false;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    replaced = replaceAliasInInput(target);
  } else {
    replaced = replaceAliasInContentEditable(target);
  }

  if (replaced) {
    event.preventDefault();
    event.stopPropagation();
  }
}

window.addEventListener(
  "focusin",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const editable = toEditableElement(target);
    if (editable) {
      lastEditableElement = editable;
    }
  },
  true,
);

function handleShortcut(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat || !stateCache) {
    return;
  }

  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return;
  }

  const pressedShortcut = eventToShortcut(event);
  if (!pressedShortcut) {
    return;
  }

  const activeProfile = getActiveProfile(stateCache);
  const match = activeProfile.items.find(
    (item) =>
      item.value.trim().length > 0 &&
      normalizeShortcut(item.shortcut) === pressedShortcut,
  );

  if (!match) {
    return;
  }

  const inserted = insertIntoFocusedField(match.value);
  if (inserted) {
    event.preventDefault();
    event.stopPropagation();
  }
}

interface QuickFillInsertMessage {
  type: "QUICK_FILL_INSERT";
  value: string;
}

function isInsertMessage(message: unknown): message is QuickFillInsertMessage {
  return (
    isRecord(message) &&
    message.type === "QUICK_FILL_INSERT" &&
    typeof message.value === "string"
  );
}

extApi.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isInsertMessage(message)) {
    return;
  }

  const inserted = insertIntoFocusedField(message.value);
  sendResponse({ ok: inserted });
});

window.addEventListener("keydown", handleShortcut, true);
window.addEventListener("keydown", handleAliasTabCompletion, true);

async function initialize(): Promise<void> {
  stateCache = await readState();
  subscribeState((next) => {
    stateCache = next;
  });
}

void initialize();
