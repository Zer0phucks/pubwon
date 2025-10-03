import { EmailService } from '@/lib/email-service';

describe('EmailService', () => {
  it('should personalize content correctly', () => {
    const service = new EmailService();
    const subscriber = {
      id: '123',
      user_id: 'user1',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      status: 'active' as const,
      subscription_source: 'web',
      confirmed_at: null,
      unsubscribed_at: null,
      metadata: null,
      created_at: '',
      updated_at: '',
    };
    
    const content = 'Hello {{FIRST_NAME}} {{LAST_NAME}}';
    const personalized = (service as any).personalize(content, subscriber);
    expect(personalized).toBe('Hello John Doe');
  });
});
