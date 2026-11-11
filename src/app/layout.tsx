import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '今天吃什麼｜點餐示範', description: 'Cloud Build 與 Cloud Run 的繁體中文點餐示範' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant" className="dark"><body className="min-h-screen bg-background text-foreground antialiased">{children}</body></html>;
}
