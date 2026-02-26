import { useEffect, useMemo, useRef, useState } from "react";
import extApi from "./lib/ext-api";
import { getActiveProfile, readState, subscribeState, writeState } from "./lib/storage";
import type { QuickFillState } from "./lib/types";

const STATUS_CLEAR_DELAY_MS = 2400;

function App() {
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

  async function insertToActiveField(value: string): Promise<void> {
    if (!value.trim()) {
      showStatus("This item has no value.");
      return;
    }

    const [activeTab] = await extApi.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab?.id) {
      showStatus("No active tab found.");
      return;
    }

    try {
      const response = await extApi.tabs.sendMessage(activeTab.id, {
        type: "QUICK_FILL_INSERT",
        value,
      });

      if (response?.ok) {
        showStatus("Inserted into focused field.");
      } else {
        showStatus("Focus an input first, then try again.");
      }
    } catch {
      showStatus("This page does not allow content scripts.");
    }
  }

  const quickItems = useMemo(() => {
    if (!activeProfile) {
      return [];
    }

    return [...activeProfile.items]
      .filter((item) => item.value.trim().length > 0)
      .sort((a, b) => Number(b.starred) - Number(a.starred));
  }, [activeProfile]);

  async function openSettingsPage(): Promise<void> {
    await extApi.runtime.openOptionsPage();
  }

  if (!state || !activeProfile) {
    return (
      <main className="popup-shell">
        <section className="panel">
          <h1 className="title">Quick Fill</h1>
          <p className="muted">Loading...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="popup-shell">
      <section className="panel">
        <div className="row-between">
          <h1 className="title">Quick Fill</h1>
          <button className="btn btn-secondary" onClick={() => void openSettingsPage()}>
            Ekstra Alanlar
          </button>
        </div>

        <p className="muted">
          Hızlı doldurma için profili seç ve alttan bir değeri tıkla.
        </p>
        <p className="muted">Ayrıca input içinde anahtar yazıp Tab basabilirsin (örn: linkedin + Tab).</p>

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

        <div className="item-list">
          {quickItems.map((item) => (
            <button
              key={item.id}
              className="item-button"
              onClick={() => void insertToActiveField(item.value)}
            >
              <span>{item.label}</span>
              <span className="shortcut">
                {item.alias ? `${item.alias}` : "-"} | {item.shortcut || "-"}
              </span>
            </button>
          ))}
        </div>

        {quickItems.length === 0 && (
          <p className="muted">Bu profilde dolu alan yok. Ekstra Alanlar sayfasından ekleyebilirsin.</p>
        )}

        <p className="status">
          {statusMessage || "İpucu: Input odaklıyken kısayol kullan (örn: ctrl+alt+1)."}
        </p>
      </section>
    </main>
  );
}

export default App;
