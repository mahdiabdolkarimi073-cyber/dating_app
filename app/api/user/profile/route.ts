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
    const { name, username, birthDate, gender, bio } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, dots, and underscores' },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to use Amori' },
        { status: 400 }
      );
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: 'Gender is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== tokenUser.userId) {
      return NextResponse.json(
        { error: 'This username is already taken by someone else' },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        name: name.trim(),
        username,
        birthDate,
        gender,
        bio: bio || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        birthDate: true,
        gender: true,
        bio: true,
        interests: true,
        photos: true,
        termsAccepted: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile saved successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
