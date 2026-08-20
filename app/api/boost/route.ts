import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const activeBoost = await prisma.boost.findFirst({
      where: {
        userId: tokenUser.userId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (activeBoost) {
      return NextResponse.json({
        boosting: true,
        expiresAt: activeBoost.expiresAt,
        remainingMs: activeBoost.expiresAt.getTime() - Date.now(),
      });
    }

    // Expire old boosts
    await prisma.boost.updateMany({
      where: { userId: tokenUser.userId, status: 'active', expiresAt: { lte: new Date() } },
      data: { status: 'expired' },
    });

    return NextResponse.json({ boosting: false });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Check existing active boost
    const existing = await prisma.boost.findFirst({
      where: { userId: tokenUser.userId, status: 'active', expiresAt: { gt: new Date() } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already boosting', expiresAt: existing.expiresAt }, { status: 400 });
    }

    const durationMinutes = 30;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const boost = await prisma.boost.create({
      data: { userId: tokenUser.userId, durationMinutes, expiresAt },
    });

    return NextResponse.json({
      boosting: true,
      expiresAt: boost.expiresAt,
      remainingMs: durationMinutes * 60 * 1000,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
