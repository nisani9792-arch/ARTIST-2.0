type StreamController = ReadableStreamDefaultController<Uint8Array>;

const subscribers = new Set<StreamController>();

export function subscribeArtistsStream(controller: StreamController): () => void {
  subscribers.add(controller);
  return () => subscribers.delete(controller);
}

export function broadcastArtistsChanged(): void {
  const payload = JSON.stringify({
    type: "artists-changed",
    at: new Date().toISOString(),
  });
  const chunk = new TextEncoder().encode(`data: ${payload}\n\n`);

  for (const controller of subscribers) {
    try {
      controller.enqueue(chunk);
    } catch {
      subscribers.delete(controller);
    }
  }
}
