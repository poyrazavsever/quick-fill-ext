import { createDefaultState } from "./defaults";
import { makeId } from "./id";
import type { QuickFillState, QuickItem, QuickProfile } from "./types";

export const STORAGE_KEY = "quick_fill_state_v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : fallback;
}

function toAlias(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeItem(raw: unknown, index: number): QuickItem | null {
  if (!isRecord(raw)) {
    return null;
  }

  const label = asNonEmptyString(raw.label, `Item ${index + 1}`);
  const aliasCandidate = asString(raw.alias);

  return {
    id: asNonEmptyString(raw.id, makeId(`item_${index}`)),
    label,
    alias: toAlias(aliasCandidate) || toAlias(label),
    value: asString(raw.value),
    type: raw.type === "link" ? "link" : "field",
    shortcut: asString(raw.shortcut),
    starred: Boolean(raw.starred),
  };
}

function normalizeProfile(raw: unknown, index: number): QuickProfile | null {
  if (!isRecord(raw)) {
    return null;
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems
    .map((item, itemIndex) => normalizeItem(item, itemIndex))
    .filter((item): item is QuickItem => item !== null);

  return {
    id: asNonEmptyString(raw.id, makeId(`profile_${index}`)),
    name: asNonEmptyString(raw.name, `Profile ${index + 1}`),
    items,
  };
}

function normalizeState(raw: unknown): QuickFillState | null {
  if (!isRecord(raw)) {
    return null;
  }

  const rawProfiles = Array.isArray(raw.profiles) ? raw.profiles : [];
  const profiles = rawProfiles
    .map((profile, profileIndex) => normalizeProfile(profile, profileIndex))
    .filter((profile): profile is QuickProfile => profile !== null);

  if (profiles.length === 0) {
    return null;
  }

  const activeProfileIdCandidate = asString(raw.activeProfileId);
  const hasActiveProfile = profiles.some(
    (profile) => profile.id === activeProfileIdCandidate,
  );

  return {
    activeProfileId: hasActiveProfile ? activeProfileIdCandidate : profiles[0].id,
    profiles,
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : Date.now(),
  };
}

export function getActiveProfile(state: QuickFillState): QuickProfile {
  return (
    state.profiles.find((profile) => profile.id === state.activeProfileId) ??
    state.profiles[0]
  );
}

export async function readState(): Promise<QuickFillState> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const normalized = normalizeState(result[STORAGE_KEY]);

  if (!normalized) {
    const defaults = createDefaultState();
    await writeState(defaults);
    return defaults;
  }

  return normalized;
}

export async function writeState(state: QuickFillState): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: state });
}

export function subscribeState(
  onChange: (state: QuickFillState) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ): void => {
    if (areaName !== "sync" || !(STORAGE_KEY in changes)) {
      return;
    }

    const rawValue = changes[STORAGE_KEY]?.newValue;
    const normalized = normalizeState(rawValue);

    if (!normalized) {
      const defaults = createDefaultState();
      void writeState(defaults);
      onChange(defaults);
      return;
    }

    onChange(normalized);
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
