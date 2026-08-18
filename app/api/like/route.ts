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

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.pass.deleteMany({
      where: { fromId: tokenUser.userId, toId: toUserId },
    }).catch(() => {});

    await prisma.like.upsert({
      where: { fromId_toId: { fromId: tokenUser.userId, toId: toUserId } },
      update: {},
      create: { fromId: tokenUser.userId, toId: toUserId },
    });

    const mutualLike = await prisma.like.findUnique({
      where: { fromId_toId: { fromId: toUserId, toId: tokenUser.userId } },
    });

    let matchId: number | null = null;

    if (mutualLike) {
      const [user1Id, user2Id] = [tokenUser.userId, toUserId].sort((a, b) => a - b);

      const existingMatch = await prisma.match.findUnique({
        where: { user1Id_user2Id: { user1Id, user2Id } },
      });

      if (existingMatch) {
        matchId = existingMatch.id;
      } else {
        const newMatch = await prisma.match.create({
          data: { user1Id, user2Id },
        });
        matchId = newMatch.id;
      }
    }

    return NextResponse.json({
      liked: true,
      matched: !!mutualLike,
      matchId,
      message: mutualLike ? "It's a match!" : 'Like sent',
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to like user' }, { status: 500 });
  }
}
