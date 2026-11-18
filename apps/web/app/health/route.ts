import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Health check của web (Render health check + smoke test so phiên bản sau triển khai). */
export function GET() {
  return NextResponse.json({ status: 'ok', service: 'brewlite-web', version: process.env.APP_VERSION ?? 'dev' });
}
