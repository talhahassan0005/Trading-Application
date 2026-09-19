import { useCallback, useEffect, useState } from 'react';

/** Shared load/refresh state for pages that fetch a list from adminService. */
export function useAsyncData<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetcher()
      .then(setData)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, reload: load };
}
