const BACKEND_NOTES_BASE_ENDPOINT = "http://127.0.0.1:8000/api/tasks";

function getAuthHeader(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader ? { Authorization: authHeader } : null;
}

async function proxyRequest(
  request: Request,
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  id: string,
) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return Response.json(
      { message: "Token manquant. Connectez-vous d'abord." },
      { status: 401 },
    );
  }

  const endpoint = `${BACKEND_NOTES_BASE_ENDPOINT}/${id}`;
  const init: RequestInit = {
    method,
    headers: {
      ...auth,
    },
  };

  if (method === "PUT" || method === "PATCH") {
    const payload = await request.json();
    init.headers = {
      ...auth,
      "Content-Type": "application/json",
    };
    init.body = JSON.stringify(payload);
  }

  const backendResponse = await fetch(endpoint, init);
  const text = await backendResponse.text();

  if ([204, 205, 304].includes(backendResponse.status)) {
    return new Response(null, { status: backendResponse.status });
  }

  return new Response(text, {
    status: backendResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await proxyRequest(request, "GET", id);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur reseau entre le frontend et le backend.",
      },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await proxyRequest(request, "PUT", id);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur reseau entre le frontend et le backend.",
      },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await proxyRequest(request, "PATCH", id);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur reseau entre le frontend et le backend.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await proxyRequest(request, "DELETE", id);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur reseau entre le frontend et le backend.",
      },
      { status: 502 },
    );
  }
}
