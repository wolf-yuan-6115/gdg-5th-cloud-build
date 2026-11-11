export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function menuError(error: unknown) {
  console.error('Unable to read menu configuration:', error);
  return json({ error: '暫時無法讀取菜單，請稍後再試。' }, 500);
}
