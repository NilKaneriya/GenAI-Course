// Glue between the local store and the account's cloud copy of the progress.
import * as store from './store.js';
import * as acc from './account.js';

const newer = (a, b) => (a || '') > (b || '');

/** Install the auto-push hook and reconcile with the server copy. Returns true if local state was replaced. */
export async function startSync() {
  store.setPersistHook(() => acc.schedulePush(store.getState));
  if (!acc.getAccount().signedIn) return false;
  try {
    const remote = await acc.pullProgress();
    const local = store.getState();
    if (remote.state && newer(remote.state.savedAt, local.savedAt)) { store.importState(remote.state); return true; }
    if (!remote.state || newer(local.savedAt, remote.state.savedAt)) await acc.pushProgress(local);
  } catch { /* offline: keep learning locally, push later */ }
  return false;
}

/** After a successful sign-in / sign-up: load the account's progress, or start the account from this browser. */
export async function afterSignIn(user, { isNew = false } = {}) {
  const remote = isNew ? { state: null } : await acc.pullProgress();
  if (remote.state) { store.importState(remote.state); return 'loaded'; }
  if (store.getState().isSample) store.resetProgress('fresh');
  if (user?.name) store.setName(user.name);
  await acc.pushProgress(store.getState());
  return 'created';
}

/** Sign out and clear this browser's copy (the account keeps its saved progress). */
export function signOutAndClear() {
  acc.signOut();
  store.resetProgress('fresh');
}
