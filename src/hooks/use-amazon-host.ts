import { useEffect, useState } from "react";
import { amazonHostForLocale } from "@/lib/amazon";

/**
 * Returns the most appropriate Amazon TLD ("com", "co.uk", "de", …) for the
 * current visitor based on `navigator.language`. Defaults to "com" during
 * SSR so the markup is stable and rehydrates cleanly.
 */
export function useAmazonHost(): string {
  const [host, setHost] = useState<string>("com");
  useEffect(() => {
    try {
      const lang =
        (typeof navigator !== "undefined" &&
          (navigator.languages?.[0] || navigator.language)) ||
        null;
      setHost(amazonHostForLocale(lang));
    } catch {
      /* keep default */
    }
  }, []);
  return host;
}