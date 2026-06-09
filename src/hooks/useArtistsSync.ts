"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function useArtistsSync() {
  const queryClient = useQueryClient();
  const retryMs = useRef(2000);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      if (closed) return;
      source?.close();
      source = new EventSource("/api/artists/stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string };
          if (data.type === "artists-changed") {
            void queryClient.invalidateQueries({ queryKey: ["artists"] });
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
      source?.close();
    };
  }, [queryClient]);
}
