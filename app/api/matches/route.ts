import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: tokenUser.userId },
          { user2Id: tokenUser.userId },
        ],
        status: 'active',
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            photos: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            photos: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            senderId: true,
            createdAt: true,
            read: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = matches.map((match) => {
      const otherUser = match.user1Id === tokenUser.userId ? match.user2 : match.user1;
      const lastMessage = match.messages[0] || null;
      const otherPhotos = otherUser.photos ? JSON.parse(otherUser.photos) : [];

      return {
        matchId: match.id,
        createdAt: match.createdAt,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          photo: otherPhotos[0] || null,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === tokenUser.userId,
              read: lastMessage.read,
            }
          : null,
      };
    });

    return NextResponse.json({ matches: formatted });
  } catch (error) {
    console.error('Matches error:', error);
    return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
  }
}
