import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const emailService = new EmailService();
    await emailService.unsubscribe(params.id);
    return new NextResponse('<html><body><h1>Unsubscribed</h1></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
