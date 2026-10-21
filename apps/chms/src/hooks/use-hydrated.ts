import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // Hydration happens once, so there is never a change to unsubscribe from.
};

/**
 * False on the server and during hydration, true once the browser renders.
 * Gate UI that depends on the viewer's clock behind it: the worker runs in
 * UTC, so "today" on the server can be a different day than the viewer's.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
