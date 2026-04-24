const BACKEND_REGISTER_ENDPOINT = "http://127.0.0.1:8000/api/register";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const backendResponse = await fetch(BACKEND_REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await backendResponse.text();
    return new Response(text, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { message: "Erreur reseau entre le frontend et le backend." },
      { status: 502 },
    );
  }
}
