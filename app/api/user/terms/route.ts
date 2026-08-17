import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { accepted } = body;

    if (!accepted) {
      return NextResponse.json(
        { error: 'You must accept the terms to continue' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        interests: true,
        photos: true,
        termsAccepted: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Terms accepted successfully',
    });
  } catch (error) {
    console.error('Terms acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept terms' },
      { status: 500 }
    );
  }
}
