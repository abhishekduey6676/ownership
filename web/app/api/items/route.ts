import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function handle() {
  // Retired: even stale clients must not read, seed or persist database items.
  return NextResponse.json({ error: 'Demo items live only in browser memory. Refresh restores the samples.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } });
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
