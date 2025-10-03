import { GET, POST } from '@/app/api/pain-points/route';
import { createServerClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/db');

describe('Pain Points API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/pain-points', () => {
    it('should return 401 if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new Request('http://localhost:3000/api/pain-points');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return pain points for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/pain-points');

      // Test implementation will depend on actual route logic
      // This is a template that should be adjusted
    });
  });

  describe('POST /api/pain-points', () => {
    it('should return 401 if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new Request('http://localhost:3000/api/pain-points', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Pain Point',
          description: 'Test description',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/pain-points', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
