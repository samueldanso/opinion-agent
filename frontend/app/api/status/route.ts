const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  const res = await fetch(`${BACKEND}/status`, { cache: "no-store" });
  const data = await res.json();
  return Response.json(data);
}
