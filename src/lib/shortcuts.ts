const MODIFIER_ALIASES: Record<string, "ctrl" | "alt" | "shift" | "meta"> = {
  control: "ctrl",
  ctrl: "ctrl",
  option: "alt",
  alt: "alt",
  shift: "shift",
  cmd: "meta",
  command: "meta",
  meta: "meta",
  win: "meta",
  super: "meta",
};

const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"] as const;

function normalizeKeyToken(token: string): string {
  const lowered = token.trim().toLowerCase();

  if (!lowered) {
    return "";
  }

  if (lowered === " ") {
    return "space";
  }

  if (lowered === "spacebar") {
    return "space";
  }

  if (lowered === "esc") {
    return "escape";
  }

  if (lowered.startsWith("arrow")) {
    return lowered;
  }

  return lowered;
}

export function normalizeShortcut(input: string): string {
  const tokens = input
    .split("+")
    .map((token) => normalizeKeyToken(token))
    .filter(Boolean);

  const modifiers = new Set<"ctrl" | "alt" | "shift" | "meta">();
  let key = "";

  for (const token of tokens) {
    const mapped = MODIFIER_ALIASES[token];

    if (mapped) {
      modifiers.add(mapped);
      continue;
    }

    key = token;
  }

  if (!key) {
    return "";
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) =>
    modifiers.has(modifier),
  );
  return [...orderedModifiers, key].join("+");
}

function normalizeEventKey(key: string): string {
  const lowered = key.toLowerCase();

  if (lowered === " ") {
    return "space";
  }

  if (lowered === "esc") {
    return "escape";
  }

  return lowered;
}

function keyFromCode(code: string): string {
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }

  if (code.startsWith("Numpad")) {
    const value = code.slice(6).toLowerCase();
    if (/^[0-9]$/.test(value)) {
      return value;
    }
    return value;
  }

  if (code.startsWith("Key")) {
    return code.slice(3).toLowerCase();
  }

  if (code === "Space") {
    return "space";
  }

  return "";
}

export function eventToShortcut(event: KeyboardEvent): string {
  const modifiers: string[] = [];

  if (event.ctrlKey) {
    modifiers.push("ctrl");
  }
  if (event.altKey) {
    modifiers.push("alt");
  }
  if (event.shiftKey) {
    modifiers.push("shift");
  }
  if (event.metaKey) {
    modifiers.push("meta");
  }

  const codeKey = keyFromCode(event.code);
  const key = codeKey || normalizeEventKey(event.key);
  if (["control", "alt", "shift", "meta"].includes(key)) {
    return "";
  }

  return normalizeShortcut([...modifiers, key].join("+"));
}
