import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, userId } = await request.json();
    const emailService = new EmailService();
    await emailService.subscribeUser(userId, email, firstName, lastName);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
