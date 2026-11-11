'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import type { MenuItem } from '@/lib/types';

const money = (value: number) => `NT$ ${value.toLocaleString('zh-TW')}`;

export default function Home() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [randomError, setRandomError] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [recommendation, setRecommendation] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadMenu() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/items', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items);
    } catch { setError('菜單載入失敗，請重試。'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/items', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setItems(data.items); })
      .catch(() => { if (!controller.signal.aborted) setError('菜單載入失敗，請重試。'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function choose() {
    setChoosing(true); setRandomError('');
    try {
      const response = await fetch('/api/items/random', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setRecommendation((await response.json()).item);
    } catch { setRandomError('暫時無法推薦餐點，請再試一次。'); }
    finally { setChoosing(false); }
  }
  function change(item: MenuItem, delta: number) {
    setCart(previous => ({ ...previous, [item.id]: Math.min(99, Math.max(0, (previous[item.id] ?? 0) + delta)) }));
    setCheckout(false);
    setNotice(delta > 0 ? `已加入${item.name}。` : `已更新${item.name}的數量。`);
  }
  const selected = items.filter(item => cart[item.id] > 0);
  const total = selected.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const count = selected.reduce((sum, item) => sum + cart[item.id], 0);

  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
    <header className="mb-12 flex flex-wrap items-start justify-between gap-6">
      <div><h1 className="text-4xl font-semibold sm:text-5xl">今天吃什麼？</h1><p className="mt-4 text-muted">挑一份喜歡的餐點，或讓我們幫你決定。</p></div>
      <Chip size="lg">點餐示範</Chip>
    </header>
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="menu-title" className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 id="menu-title" className="text-2xl font-semibold">今日菜單</h2><Button variant="secondary" isPending={choosing} isDisabled={loading || !items.length} onPress={choose}>{choosing ? '正在挑選…' : '幫我選一餐'}</Button></div>
        {randomError && <p role="alert" className="mb-4 text-danger">{randomError}</p>}
        {recommendation && <Card className="mb-6" aria-live="polite"><Card.Header><Card.Title>這次推薦：{recommendation.name}</Card.Title><Card.Description>{recommendation.description}</Card.Description></Card.Header><Card.Footer className="justify-between gap-4"><span>{money(recommendation.price)}</span><Button onPress={() => change(recommendation, 1)} isDisabled={checkout || (cart[recommendation.id] ?? 0) >= 99}>加入這道餐點</Button></Card.Footer></Card>}
        {loading ? <p role="status" className="py-12 text-muted">正在準備菜單…</p> : error ? <div role="alert" className="space-y-4 py-8"><p>{error}</p><Button onPress={loadMenu}>重新載入</Button></div> : !items.length ? <p className="py-12 text-muted">目前沒有餐點，請稍後再來。</p> : <ul className="divide-y divide-separator">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-5 py-6"><div className="min-w-0 flex-1 basis-52"><p className="mb-2 text-sm text-muted">{item.category}</p><h3 className="text-xl font-medium">{item.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p></div><div className="flex items-center gap-5"><span className="whitespace-nowrap font-medium tabular-nums">{money(item.price)}</span><Button variant="secondary" aria-label={`加入${item.name}`} onPress={() => change(item, 1)} isDisabled={checkout || (cart[item.id] ?? 0) >= 99}>加入</Button></div></li>)}</ul>}
        <p className="mt-6 text-sm text-muted">菜單與價格皆為示範資料，不提供實際餐飲服務。</p>
      </section>
      <aside aria-labelledby="cart-title" className="lg:sticky lg:top-8">
        <Card className="p-6"><Card.Header><h2 id="cart-title" className="text-2xl font-semibold">{checkout ? '確認餐點' : '你的餐點'}</h2><Card.Description>{checkout ? '確認以下品項與金額後，完成模擬結帳。' : '選好之後，就可以試試模擬結帳。'}</Card.Description></Card.Header>
          <Card.Content className="py-6">
            {!selected.length ? <p className="py-8 text-center text-muted">還沒決定嗎？<br />從左邊菜單挑一道吧。</p> : <ul className="space-y-6">{selected.map(item => <li key={item.id}><div className="flex justify-between gap-4"><span>{item.name}</span><span className="tabular-nums">{money(item.price * cart[item.id])}</span></div><div className="mt-3 flex flex-wrap items-center gap-3"><Button size="sm" variant="tertiary" aria-label={`減少${item.name}`} isDisabled={checkout} onPress={() => change(item, -1)}>減少</Button><span className="tabular-nums" aria-label={`${item.name}數量`}>{cart[item.id]}</span><Button size="sm" variant="tertiary" aria-label={`增加${item.name}`} isDisabled={checkout || cart[item.id] >= 99} onPress={() => change(item, 1)}>增加</Button><Button size="sm" variant="ghost" aria-label={`移除${item.name}`} isDisabled={checkout} onPress={() => change(item, -cart[item.id])}>移除</Button></div></li>)}</ul>}
          </Card.Content>
          <Card.Footer className="flex-col items-stretch gap-4"><div className="flex justify-between border-t border-separator pt-5"><span>合計（{count} 份）</span><strong className="text-xl tabular-nums">{money(total)}</strong></div>{checkout ? <><Button onPress={() => { setCart({}); setCheckout(false); setNotice('模擬訂單完成，未實際送出。'); }}>確認模擬結帳</Button><Button variant="secondary" onPress={() => setCheckout(false)}>返回修改</Button></> : <Button isDisabled={!selected.length} onPress={() => { setCheckout(true); setNotice('請確認品項與金額。'); }}>模擬結帳</Button>}<p className="text-sm leading-relaxed text-muted">不會收取費用或送出訂單。重新整理頁面會清空購物車。</p></Card.Footer>
        </Card><p role="status" className="mt-4 min-h-12 text-sm">{notice}</p>
      </aside>
    </div>
    <footer className="mt-16 border-t border-separator pt-6 text-sm text-muted">Cloud Build × Cloud Run · 雲端應用示範</footer>
  </main>;
}
