"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Home, MapPin, Plus } from 'lucide-react';
import { useMock } from '@/components/mock-provider';
const navigation = [{ href: '/', label: 'Home', icon: Home }, { href: '/items', label: 'Items', icon: Box }, { href: '/locations', label: 'Locations', icon: MapPin }, { href: '/items/new', label: 'Add item', icon: Plus }];
export function OwnershipShell({children}: {children: React.ReactNode; active?: string}) {
  const path = usePathname();
  const { loading, loadError, reload } = useMock();
  return <div className="min-h-screen">
    <header className="app-header">
      <Link href="/" className="brand"><Box /> Ownership<span className="brand-dot" /></Link>
      <nav className="desktop-nav" aria-label="Primary">{navigation.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><Icon size={17}/>{label}</Link>)}</nav>
      <span className="demo-chip">AI DEMO</span>
    </header>
    <div className="demo-strip">AI demo · Warranty display reference: 12 Sep 2026 · Items and edits stay in this tab until refresh · Refresh restores samples · Original files not saved by this app</div>
    <main>{loading ? <div className="page-wrap" role="status">Loading your records…</div> : loadError ? <div className="page-wrap"><p role="alert" className="error">{loadError}</p><button className="action" onClick={() => void reload()}>Retry loading records</button></div> : children}</main>
    <nav className="mobile-nav" aria-label="Mobile">{navigation.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><Icon size={20}/>{label}</Link>)}</nav>
  </div>;
}
