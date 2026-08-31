import { fetchPersistedState, savePersistedState } from './api';
import { buildPersistedState, useForecastStore } from './store';

const SAVE_DEBOUNCE_MS = 800;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let saveAgain = false;

function flushSave() {
  if (saving) {
    saveAgain = true;
    return;
  }
  saving = true;
  const data = buildPersistedState(useForecastStore.getState());
  savePersistedState(data)
    .catch((err) => console.error('Failed to save to the server — your latest change may not have been kept:', err))
    .finally(() => {
      saving = false;
      if (saveAgain) {
        saveAgain = false;
        flushSave();
      }
    });
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
}

const HYDRATE_TIMEOUT_MS = 4000;

/**
 * Loads the shared state from the server once at startup, then keeps it in sync:
 * every subsequent store change is (debounced) pushed back up. Call once from main.tsx.
 *
 * Races the initial fetch against a timeout so a host with no backend at all (e.g. this
 * app published as a standalone static preview) falls back to local-only defaults instead
 * of leaving the UI stuck on the loading screen.
 */
export function initPersistence() {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), HYDRATE_TIMEOUT_MS));
  Promise.race([fetchPersistedState(), timeout])
    .then((data) => useForecastStore.getState().hydrate(data))
    .catch((err) => {
      console.error('Failed to load from the server — starting from local defaults:', err);
      useForecastStore.getState().hydrate(null);
    });

  useForecastStore.subscribe((state, prevState) => {
    // Not hydrated yet, or this is the hydration tick itself — nothing to save yet.
    if (!state.hydrated || !prevState.hydrated) return;
    scheduleSave();
  });
}
