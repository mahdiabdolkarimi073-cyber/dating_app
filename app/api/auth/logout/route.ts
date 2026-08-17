import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ message: 'خروج موفقیت‌آمیز بود' });
}
