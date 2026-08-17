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
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 });
    }

    // Check target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove any existing pass (in case they previously passed)
    await prisma.pass.deleteMany({
      where: { fromId: tokenUser.userId, toId: toUserId },
    }).catch(() => {});

    // Create the like (upsert to avoid duplicates)
    await prisma.like.upsert({
      where: { fromId_toId: { fromId: tokenUser.userId, toId: toUserId } },
      update: {},
      create: { fromId: tokenUser.userId, toId: toUserId },
    });

    // Check if the other user also liked us (mutual like = match)
    const mutualLike = await prisma.like.findUnique({
      where: { fromId_toId: { fromId: toUserId, toId: tokenUser.userId } },
    });

    return NextResponse.json({
      liked: true,
      matched: !!mutualLike,
      message: mutualLike ? "It's a match!" : 'Like sent',
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to like user' }, { status: 500 });
  }
}
