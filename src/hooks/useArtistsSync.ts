"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const DEBOUNCE_MS = 4000;

export function useArtistsSync() {
  const queryClient = useQueryClient();
  const retryMs = useRef(2000);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const scheduleRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["artists"] });
      }, DEBOUNCE_MS);
    };

    const connect = () => {
      if (closed) return;
      source?.close();
      source = new EventSource("/api/artists/stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string };
          if (data.type === "artists-changed") {
            scheduleRefetch();
          }
        } catch {
          /* ignore */
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        retryTimer = setTimeout(() => {
          retryMs.current = Math.min(retryMs.current * 1.5, 30_000);
          connect();
        }, retryMs.current);
      };

      source.onopen = () => {
        retryMs.current = 2000;
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      source?.close();
    };
  }, [queryClient]);
}
