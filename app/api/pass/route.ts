import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId } = body;

    if (!toUserId || typeof toUserId !== 'number') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (toUserId === tokenUser.userId) {
      return NextResponse.json({ error: 'Cannot pass yourself' }, { status: 400 });
    }

    // Remove any existing like
    await prisma.like.deleteMany({
      where: { fromId: tokenUser.userId, toId: toUserId },
    }).catch(() => {});

    // Create the pass (upsert to avoid duplicates)
    await prisma.pass.upsert({
      where: { fromId_toId: { fromId: tokenUser.userId, toId: toUserId } },
      update: {},
      create: { fromId: tokenUser.userId, toId: toUserId },
    });

    return NextResponse.json({
      passed: true,
      message: 'User passed',
    });
  } catch (error) {
    console.error('Pass error:', error);
    return NextResponse.json({ error: 'Failed to pass user' }, { status: 500 });
  }
}
