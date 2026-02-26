import { useEffect, useMemo, useRef, useState } from "react";
import { makeId } from "../lib/id";
import { getActiveProfile, readState, subscribeState, writeState } from "../lib/storage";
import type { QuickFillState, QuickItem, QuickItemType, QuickProfile } from "../lib/types";

const STATUS_CLEAR_DELAY_MS = 2500;

function toAlias(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

function OptionsApp() {
  const [state, setState] = useState<QuickFillState | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const clearStatusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    void readState().then((loaded) => {
      if (mounted) {
        setState(loaded);
      }
    });

    const unsubscribe = subscribeState((next) => {
      if (mounted) {
        setState(next);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (clearStatusTimerRef.current !== null) {
        window.clearTimeout(clearStatusTimerRef.current);
      }
    };
  }, []);

  const activeProfile = useMemo(
    () => (state ? getActiveProfile(state) : null),
    [state],
  );

  function showStatus(message: string): void {
    setStatusMessage(message);
    if (clearStatusTimerRef.current !== null) {
      window.clearTimeout(clearStatusTimerRef.current);
    }

    clearStatusTimerRef.current = window.setTimeout(() => {
      setStatusMessage("");
    }, STATUS_CLEAR_DELAY_MS);
  }

  function patchState(updater: (previous: QuickFillState) => QuickFillState): void {
    setState((previous) => {
      if (!previous) {
        return previous;
      }

      const next = {
        ...updater(previous),
        updatedAt: Date.now(),
      };

      void writeState(next);
      return next;
    });
  }

  function setActiveProfile(profileId: string): void {
    patchState((previous) => ({
      ...previous,
      activeProfileId: profileId,
    }));
  }

  function addProfile(): void {
    const newProfile: QuickProfile = {
      id: makeId("profile"),
      name: `Profile ${state ? state.profiles.length + 1 : 1}`,
      items: [],
    };

    patchState((previous) => ({
      ...previous,
      profiles: [...previous.profiles, newProfile],
      activeProfileId: newProfile.id,
    }));
  }

  function removeActiveProfile(): void {
    if (!state || state.profiles.length <= 1 || !activeProfile) {
      showStatus("En az bir profil kalmalı.");
      return;
    }

    patchState((previous) => {
      const remaining = previous.profiles.filter(
        (profile) => profile.id !== previous.activeProfileId,
      );

      return {
        ...previous,
        profiles: remaining,
        activeProfileId: remaining[0].id,
      };
    });
  }

  function updateProfileName(name: string): void {
    if (!activeProfile) {
      return;
    }

    patchState((previous) => ({
      ...previous,
      profiles: previous.profiles.map((profile) =>
        profile.id === previous.activeProfileId ? { ...profile, name } : profile,
      ),
    }));
  }

  function addItem(type: QuickItemType): void {
    if (!activeProfile) {
      return;
    }

    const newItem: QuickItem = {
      id: makeId("item"),
      label: type === "link" ? "Yeni Link" : "Yeni Alan",
      alias: type === "link" ? "link" : "field",
      value: "",
      type,
      shortcut: "",
      starred: type === "link",
    };

    patchState((previous) => ({
      ...previous,
      profiles: previous.profiles.map((profile) =>
        profile.id === previous.activeProfileId
          ? { ...profile, items: [...profile.items, newItem] }
          : profile,
      ),
    }));
  }

  function updateItem(itemId: string, updates: Partial<QuickItem>): void {
    patchState((previous) => ({
      ...previous,
      profiles: previous.profiles.map((profile) =>
        profile.id === previous.activeProfileId
          ? {
              ...profile,
              items: profile.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item,
              ),
            }
          : profile,
      ),
    }));
  }

  function removeItem(itemId: string): void {
    patchState((previous) => ({
      ...previous,
      profiles: previous.profiles.map((profile) =>
        profile.id === previous.activeProfileId
          ? {
              ...profile,
              items: profile.items.filter((item) => item.id !== itemId),
            }
          : profile,
      ),
    }));
  }

  if (!state || !activeProfile) {
    return (
      <main className="options-shell">
        <section className="panel">
          <div className="brand-row">
            <img className="brand-logo" src="/logo.png" alt="Shortcut Injector" />
            <h1 className="title">Shortcut Injector Ayarlar</h1>
          </div>
          <p className="muted">Yükleniyor...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="options-shell">
      <section className="panel">
        <div className="brand-row">
          <img className="brand-logo" src="/logo.png" alt="Shortcut Injector" />
          <h1 className="title">Shortcut Injector Ayarlar</h1>
        </div>
        <p className="muted">Ekstra alanlar, profiller ve kısayollar burada yönetilir.</p>

        <div className="grid two-columns">
          <div>
            <label className="label" htmlFor="profile-select">
              Aktif Profil
            </label>
            <select
              id="profile-select"
              className="input"
              value={state.activeProfileId}
              onChange={(event) => setActiveProfile(event.target.value)}
            >
              {state.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="profile-name">
              Profil Adı
            </label>
            <input
              id="profile-name"
              className="input"
              value={activeProfile.name}
              onChange={(event) => updateProfileName(event.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <button className="btn btn-secondary" onClick={addProfile}>
            Profil Ekle
          </button>
          <button className="btn btn-danger" onClick={removeActiveProfile}>
            Aktif Profili Sil
          </button>
        </div>

        <hr className="divider" />

        <div className="row-between">
          <h2 className="subtitle">Alanlar</h2>
          <div className="row">
            <button className="btn btn-secondary" onClick={() => addItem("field")}>
              Field Ekle
            </button>
            <button className="btn btn-secondary" onClick={() => addItem("link")}>
              Link Ekle
            </button>
          </div>
        </div>

        <div className="item-grid">
          {activeProfile.items.map((item) => (
            <article key={item.id} className="item-card">
              <div className="row-between">
                <span className="chip">{item.type}</span>
                <label className="row checkbox-row">
                  <input
                    type="checkbox"
                    checked={item.starred}
                    onChange={(event) =>
                      updateItem(item.id, { starred: event.target.checked })
                    }
                  />
                  <span>Star</span>
                </label>
              </div>

              <label className="label" htmlFor={`label-${item.id}`}>
                Label
              </label>
              <input
                id={`label-${item.id}`}
                className="input"
                value={item.label}
                onChange={(event) => updateItem(item.id, { label: event.target.value })}
              />

              <label className="label" htmlFor={`value-${item.id}`}>
                Value
              </label>
              <input
                id={`value-${item.id}`}
                className="input"
                value={item.value}
                placeholder={item.type === "link" ? "https://..." : "Varsayılan değer"}
                onChange={(event) => updateItem(item.id, { value: event.target.value })}
              />

              <label className="label" htmlFor={`shortcut-${item.id}`}>
                Shortcut
              </label>
              <input
                id={`shortcut-${item.id}`}
                className="input"
                value={item.shortcut}
                placeholder="ctrl+alt+1"
                onChange={(event) =>
                  updateItem(item.id, { shortcut: event.target.value.toLowerCase() })
                }
              />

              <label className="label" htmlFor={`type-${item.id}`}>
                Anahtar
              </label>
              <input
                id={`alias-${item.id}`}
                className="input"
                value={item.alias}
                placeholder="linkedin"
                onChange={(event) =>
                  updateItem(item.id, { alias: toAlias(event.target.value) })
                }
              />

              <label className="label" htmlFor={`type-${item.id}`}>
                Type
              </label>
              <select
                id={`type-${item.id}`}
                className="input"
                value={item.type}
                onChange={(event) =>
                  updateItem(item.id, { type: event.target.value as QuickItemType })
                }
              >
                <option value="field">field</option>
                <option value="link">link</option>
              </select>

              <div className="row">
                <button className="btn btn-danger" onClick={() => removeItem(item.id)}>
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>

        {activeProfile.items.length === 0 && (
          <p className="muted">Bu profilde henüz alan yok.</p>
        )}

        <p className="status">
          {statusMessage || "Kısayol örneği: ctrl+alt+1. Değişiklikler otomatik kaydedilir."}
        </p>
      </section>
    </main>
  );
}

export default OptionsApp;
