import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const myUser = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { id: true, isPremium: true, lastRewindAt: true },
    });
    if (!myUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Rate limit: free = 1 per hour, premium = unlimited (every 5 min)
    const cooldownMs = myUser.isPremium ? 5 * 60 * 1000 : 60 * 60 * 1000;
    if (myUser.lastRewindAt && Date.now() - myUser.lastRewindAt.getTime() < cooldownMs) {
      const remaining = cooldownMs - (Date.now() - myUser.lastRewindAt.getTime());
      return NextResponse.json({
        error: 'Rewind cooldown',
        remainingMs: remaining,
        isPremium: myUser.isPremium,
      }, { status: 429 });
    }

    // Find the most recent pass
    const lastPass = await prisma.pass.findFirst({
      where: { fromId: tokenUser.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastPass) {
      return NextResponse.json({ error: 'No pass to rewind' }, { status: 400 });
    }

    // Delete the pass so the user reappears in discovery
    await prisma.pass.delete({ where: { id: lastPass.id } });
    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { lastRewindAt: new Date() },
    });

    // Fetch the user to show
    const rewoundUser = await prisma.user.findUnique({
      where: { id: lastPass.toId },
      select: {
        id: true, name: true, username: true, birthDate: true, gender: true,
        bio: true, interests: true, photos: true, isOnline: true, verification: true,
      },
    });

    if (!rewoundUser) {
      return NextResponse.json({ success: true, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...rewoundUser,
        interests: rewoundUser.interests ? JSON.parse(rewoundUser.interests) : [],
        photos: rewoundUser.photos ? JSON.parse(rewoundUser.photos) : [],
      },
    });
  } catch (error) {
    console.error('Rewind error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
