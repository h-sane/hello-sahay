import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

// Loads once on mount; reload() refetches in the background without flashing the loading state.
export function useLoad<T>(fetcher: () => Promise<T>, onAuthError: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef({ fetcher, onAuthError });
  latest.current = { fetcher, onAuthError };

  const reload = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setData(await latest.current.fetcher());
      setError(null);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError("http", "Something went wrong.");
      if (err.kind === "auth") latest.current.onAuthError();
      else setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload: () => reload(true), refresh: () => reload(false) };
}
