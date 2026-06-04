
'use client';

import { useMemo, DependencyList } from 'react';

/**
 * A specialized hook to memoize Firebase references and queries.
 * Since Firebase Query and DocumentReference objects are often recreated on every render
 * when defined inside a component, this hook ensures they are stable unless their dependencies change.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
