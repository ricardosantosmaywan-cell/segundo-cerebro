"use client";

import { useEffect, useState } from "react";
import { repo } from "@/lib/data";

type QueryState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "ready"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: Error };

/**
 * Runs `query` on mount and again after every write to the repository.
 * `query` must be stable (define it at module level or with useCallback).
 */
export function useRepoQuery<T>(query: () => Promise<T>): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    status: "loading",
    data: undefined,
    error: undefined,
  });

  useEffect(() => {
    let alive = true;
    const run = () => {
      query().then(
        (data) => alive && setState({ status: "ready", data, error: undefined }),
        (err: unknown) =>
          alive &&
          setState({
            status: "error",
            data: undefined,
            error: err instanceof Error ? err : new Error(String(err)),
          }),
      );
    };
    run();
    const unsubscribe = repo.subscribe(run);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [query]);

  return state;
}
