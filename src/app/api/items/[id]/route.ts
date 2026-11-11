import { readMenu } from '@/lib/menu';
import { json, menuError } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = (await readMenu()).find(item => item.id === id);
    return item ? json({ item }) : json({ error: '找不到這道餐點。' }, 404);
  } catch (error) { return menuError(error); }
}
