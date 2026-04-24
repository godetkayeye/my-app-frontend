const BACKEND_NOTES_ENDPOINT = "http://127.0.0.1:8000/api/notes";

function getAuthHeader(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader ? { Authorization: authHeader } : null;
}

export async function GET(request: Request) {
  try {
    const auth = getAuthHeader(request);
    if (!auth) {
      return Response.json(
        { message: "Token manquant. Connectez-vous d'abord." },
        { status: 401 },
      );
    }

    const backendResponse = await fetch(BACKEND_NOTES_ENDPOINT, {
      method: "GET",
      headers: {
        ...auth,
      },
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

export async function POST(request: Request) {
  try {
    const auth = getAuthHeader(request);
    if (!auth) {
      return Response.json(
        { message: "Token manquant. Connectez-vous d'abord." },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const backendResponse = await fetch(BACKEND_NOTES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth,
      },
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
