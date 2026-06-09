import { subscribeArtistsStream } from "@/lib/artists-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let unsubscribe: (() => void) | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      unsubscribe = subscribeArtistsStream(controller);
      const welcome = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "connected", at: new Date().toISOString() })}\n\n`,
      );
      controller.enqueue(welcome);

      keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          /* stream closed */
        }
      }, 25_000);
    },
    cancel() {
      if (keepalive) clearInterval(keepalive);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
