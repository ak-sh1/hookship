function validHttpsUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!validHttpsUrl(payload.endpointUrl)) {
      return Response.json({ error: "Enter a valid HTTPS URL." }, { status: 400 });
    }

    return Response.json({
      delivery: {
        id: `evt_${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
        event: String(payload.event ?? "test.event"),
        endpoint: String(payload.endpointName ?? "Demo destination"),
        status: "Delivered",
        attempts: Math.max(1, Number(payload.attempt) || 1),
        time: "just now",
        response: "200 OK",
        payload: JSON.stringify(payload.data ?? {}, null, 2),
      },
      transport: "simulated",
    });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
