'use client';

import { usePathname } from 'next/navigation';
import LogoutButton from '@/app/dashboard/LogoutButton';

function getBackLink(pathname: string): { href: string; label: string } | null {
  if (pathname === '/login') return null;
  if (pathname === '/') return null;
  if (pathname === '/dashboard') return null;
  if (pathname.startsWith('/termine/buchen')) return { href: '/termine', label: 'Zurück zu Meine Termine' };
  if (pathname === '/termine') return { href: '/dashboard', label: 'Zurück zum Dashboard' };
  if (pathname === '/einwilligungen') return { href: '/dashboard', label: 'Zurück zum Dashboard' };
  if (pathname.startsWith('/praxis/')) return { href: '/praxis', label: 'Zurück zum Praxis-Bereich' };
  if (pathname === '/praxis') return { href: '/dashboard', label: 'Zurück zum Dashboard' };
  return null;
}

export default function Header() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const backLink = getBackLink(pathname);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#fff',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        {backLink ? (
          <a
            href={backLink.href}
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            &larr; {backLink.label}
          </a>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Praxis Demir &amp; Kollegen
          </span>
        )}
      </div>
      <LogoutButton />
    </header>
  );
}
