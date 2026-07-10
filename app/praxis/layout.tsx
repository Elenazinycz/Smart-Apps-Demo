import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function PraxisLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.type !== 'praxis') redirect('/dashboard');

  return children;
}