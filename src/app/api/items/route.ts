import { readMenu } from '@/lib/menu';
import { json, menuError } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return json({ items: await readMenu() }); } catch (error) { return menuError(error); }
}
