"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** False on SSR and first client paint; true after hydration. Avoids hydration mismatches from wallet/window. */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
