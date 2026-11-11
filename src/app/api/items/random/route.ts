import { readMenu, chooseItem } from '@/lib/menu';
import { json, menuError } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const item = chooseItem(await readMenu());
    return item ? json({ item }) : json({ error: '目前沒有可推薦的餐點。' }, 404);
  } catch (error) { return menuError(error); }
}
