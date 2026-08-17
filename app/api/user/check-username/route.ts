import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      return NextResponse.json(
        {
          available: false,
          error: 'فقط حروف انگلیسی، اعداد، نقطه و زیرخط مجاز است',
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { available: false, error: 'این نام کاربری قبلاً گرفته شده است' },
        { status: 200 }
      );
    }

    return NextResponse.json({ available: true }, { status: 200 });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { available: false, error: 'خطا در بررسی نام کاربری' },
      { status: 500 }
    );
  }
}
