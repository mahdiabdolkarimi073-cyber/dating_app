import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// SSE endpoint for real-time notifications (new messages, new matches, new likes)
export async function GET(request: Request) {
  const tokenUser = await getAuthUser();
  if (!tokenUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = tokenUser.userId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastCheck = new Date();

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          // Check for new messages from matches
          const newMessages = await prisma.message.findMany({
            where: {
              read: false,
              senderId: { not: userId },
              match: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
              },
              createdAt: { gt: lastCheck },
            },
            include: {
              sender: {
                select: { id: true, name: true, username: true, photos: true },
              },
              match: {
                select: { id: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          for (const msg of newMessages) {
            const senderPhotos = msg.sender.photos ? JSON.parse(msg.sender.photos) : [];
            const notification = {
              type: 'message',
              matchId: msg.match.id,
              senderId: msg.sender.id,
              senderName: msg.sender.name,
              senderPhoto: senderPhotos[0] || null,
              content: msg.content,
              createdAt: msg.createdAt,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
            );
          }

          // Check for new matches
          const newMatches = await prisma.match.findMany({
            where: {
              OR: [{ user1Id: userId }, { user2Id: userId }],
              createdAt: { gt: lastCheck },
            },
            include: {
              user1: { select: { id: true, name: true, photos: true } },
              user2: { select: { id: true, name: true, photos: true } },
            },
            take: 5,
          });

          for (const match of newMatches) {
            const otherUser = match.user1Id === userId ? match.user2 : match.user1;
            const otherPhotos = otherUser.photos ? JSON.parse(otherUser.photos) : [];
            const notification = {
              type: 'match',
              matchId: match.id,
              senderName: otherUser.name,
              senderPhoto: otherPhotos[0] || null,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
            );
          }

          // Check for new likes
          const newLikes = await prisma.like.findMany({
            where: {
              toId: userId,
              createdAt: { gt: lastCheck },
            },
            include: {
              fromUser: { select: { id: true, name: true, photos: true } },
            },
            take: 5,
          });

          for (const like of newLikes) {
            const fromPhotos = like.fromUser.photos ? JSON.parse(like.fromUser.photos) : [];
            const notification = {
              type: 'like',
              senderId: like.fromUser.id,
              senderName: like.fromUser.name,
              senderPhoto: fromPhotos[0] || null,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
            );
          }

          lastCheck = new Date();
        } catch {
          // silent
        }
      }, 2000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
