import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST typing indicator
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, typing } = body;

    if (!matchId || typeof matchId !== 'number') {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true, status: true },
    });

    if (!match || match.status !== 'active') {
      return NextResponse.json({ error: 'Invalid match' }, { status: 400 });
    }

    const isParticipant =
      match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Typing state is ephemeral; clients poll this endpoint
    const key = `typing:${matchId}:${tokenUser.userId}`;
    // Use a simple in-memory approach via global store
    const g = globalThis as unknown as { typingState?: Map<string, { typing: boolean; ts: number }> };
    if (!g.typingState) g.typingState = new Map();
    g.typingState.set(key, { typing: !!typing, ts: Date.now() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Typing POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// GET typing status for the other user in a match
export async function GET(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = parseInt(searchParams.get('matchId') || '0', 10);

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const otherUserId =
      match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;
    const key = `typing:${matchId}:${otherUserId}`;

    const g = globalThis as unknown as { typingState?: Map<string, { typing: boolean; ts: number }> };
    if (!g.typingState) g.typingState = new Map();
    const state = g.typingState.get(key);
    // Expire after 5 seconds
    const isTyping = state && state.typing && Date.now() - state.ts < 5000;

    return NextResponse.json({ typing: !!isTyping });
  } catch (error) {
    console.error('Typing GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
