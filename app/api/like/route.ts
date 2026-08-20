import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBlockedUserIds, checkLikeSpam, flagUserIfNeeded } from '@/lib/moderation';

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, superLike } = body;

    if (!toUserId || typeof toUserId !== 'number') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (toUserId === tokenUser.userId) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 });
    }

    // Super like limit check
    if (superLike) {
      const myUser = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: { isPremium: true, superLikesRemaining: true, superLikesResetAt: true },
      });
      if (!myUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // Reset daily super likes if needed
      let remaining = myUser.superLikesRemaining;
      const now = new Date();
      if (!myUser.superLikesResetAt || now > myUser.superLikesResetAt) {
        remaining = myUser.isPremium ? 5 : 1;
        await prisma.user.update({
          where: { id: tokenUser.userId },
          data: {
            superLikesRemaining: remaining,
            superLikesResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      }

      if (remaining <= 0) {
        return NextResponse.json({
          error: 'No super likes remaining',
          remaining: 0,
          isPremium: myUser.isPremium,
        }, { status: 429 });
      }

      await prisma.user.update({
        where: { id: tokenUser.userId },
        data: { superLikesRemaining: remaining - 1 },
      });
    }

    // Respect blocks (both directions)
    const blockedIds = await getBlockedUserIds(tokenUser.userId);
    if (blockedIds.includes(toUserId)) {
      return NextResponse.json({ error: 'User not available' }, { status: 403 });
    }

    // Spam detection
    if (await checkLikeSpam(tokenUser.userId)) {
      await flagUserIfNeeded(tokenUser.userId, 'spam');
      return NextResponse.json({ error: 'Too many actions. Please slow down.' }, { status: 429 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, status: true },
    });

    if (!targetUser || targetUser.status !== 'active') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.pass.deleteMany({
      where: { fromId: tokenUser.userId, toId: toUserId },
    }).catch(() => {});

    await prisma.like.upsert({
      where: { fromId_toId: { fromId: tokenUser.userId, toId: toUserId } },
      update: { superLike: !!superLike },
      create: { fromId: tokenUser.userId, toId: toUserId, superLike: !!superLike },
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

      // Create match notifications for both users
      const me = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: { name: true },
      });
      const other = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { name: true },
      });
      await prisma.notification.create({
        data: {
          userId: toUserId,
          type: 'match',
          title: "It's a match!",
          body: `${me?.name || 'Someone'} liked you back`,
          link: `/chat/${matchId}`,
          actorId: tokenUser.userId,
        },
      });
      await prisma.notification.create({
        data: {
          userId: tokenUser.userId,
          type: 'match',
          title: "It's a match!",
          body: `You matched with ${other?.name || 'someone'}`,
          link: `/chat/${matchId}`,
          actorId: toUserId,
        },
      });
    } else {
      // Create a like_request notification for the recipient
      const me = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: { name: true },
      });
      await prisma.notification.create({
        data: {
          userId: toUserId,
          type: 'like_request',
          title: 'New like',
          body: `${me?.name || 'Someone'} liked you`,
          link: '/likes',
          actorId: tokenUser.userId,
        },
      });
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
