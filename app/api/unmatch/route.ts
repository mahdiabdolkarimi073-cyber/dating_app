import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST unmatch
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, alsoBlock } = body;

    if (!matchId || typeof matchId !== 'number') {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, user1Id: true, user2Id: true, status: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const isParticipant =
      match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (match.status !== 'active') {
      return NextResponse.json({ error: 'Match already inactive' }, { status: 400 });
    }

    const otherUserId =
      match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'unmatched',
        unmatchedBy: tokenUser.userId,
        unmatchedAt: new Date(),
      },
    });

    if (alsoBlock) {
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: tokenUser.userId, blockedId: otherUserId } },
        update: {},
        create: { blockerId: tokenUser.userId, blockedId: otherUserId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmatch error:', error);
    return NextResponse.json({ error: 'Failed to unmatch' }, { status: 500 });
  }
}
