import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e?.message ?? "Something went wrong"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData: setData as Dispatch<SetStateAction<T | null>> };
}
