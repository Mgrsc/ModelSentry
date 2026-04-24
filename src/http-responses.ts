const JSON_HEADERS = { 'Content-Type': 'application/json' };
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

export function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: HTML_HEADERS
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

export function internalServerError(): Response {
  return textResponse('Internal Server Error', 500);
}
