export function isSameOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return false;

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  const requestUrl = new URL(request.url);
  const host = request.headers.get("host");
  if (!host) return origin.origin === requestUrl.origin;

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") return false;

  return origin.origin === `${protocol}://${host}`;
}
