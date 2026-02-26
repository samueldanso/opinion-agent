export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  const upstream = await fetch(`${BACKEND}/events`, {
    headers: { Accept: "text/event-stream" },
    // @ts-ignore — undici-specific: disable body timeout so SSE stays alive
    signal: null,
    keepalive: true,
  });

  if (!upstream.body) {
    return new Response("Backend SSE unavailable", { status: 502 });
  }

  const { readable, writable } = new TransformStream();
  upstream.body.pipeTo(writable).catch(() => {});

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
