import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// SSE endpoint for real-time message delivery
export async function GET(request: Request) {
  const tokenUser = await getAuthUser();
  if (!tokenUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = parseInt(searchParams.get('matchId') || '0', 10);
  if (!matchId) {
    return new Response('Match ID required', { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { user1Id: true, user2Id: true, status: true },
  });

  if (!match) {
    return new Response('Match not found', { status: 404 });
  }

  const isParticipant =
    match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
  if (!isParticipant) {
    return new Response('Forbidden', { status: 403 });
  }

  const otherUserId =
    match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastMessageId = 0;
      let closed = false;
      let lastMatchStatus = match.status;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const recentMessages = await prisma.message.findMany({
        where: { matchId, deleted: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true },
      });
      if (recentMessages.length > 0) {
        lastMessageId = recentMessages[0].id;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'init', lastMessageId })}\n\n`)
        );
      }

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          // Check match status
          const currentMatch = await prisma.match.findUnique({
            where: { id: matchId },
            select: { status: true },
          });
          if (currentMatch && currentMatch.status !== lastMatchStatus) {
            lastMatchStatus = currentMatch.status;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'unmatch' })}\n\n`)
            );
          }

          // New messages
          const newMessages = await prisma.message.findMany({
            where: {
              matchId,
              id: { gt: lastMessageId },
              deleted: false,
            },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              senderId: true,
              content: true,
              status: true,
              mediaUrl: true,
              replyToId: true,
              read: true,
              createdAt: true,
            },
          });

          for (const msg of newMessages) {
            lastMessageId = msg.id;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'message', message: msg })}\n\n`)
            );

            if (msg.senderId === otherUserId && !msg.read) {
              await prisma.message.update({
                where: { id: msg.id },
                data: { read: true, status: 'seen' },
              });
            }
          }

          // Check for status updates on existing messages
          const statusUpdates = await prisma.message.findMany({
            where: {
              matchId,
              senderId: otherUserId,
              status: { in: ['delivered', 'seen'] },
            },
            select: { id: true, status: true },
          });
          // We don't track which we've sent, so skip to avoid spam
        } catch {
          // silent error, keep streaming
        }
      }, 1000);

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
