import { BlogGenerator } from '@/lib/blog-generator';

describe('BlogGenerator', () => {
  it('should generate valid slug from title', () => {
    const generator = new BlogGenerator();
    const title = 'Hello World: A Test Title!';
    const slug = (generator as any).generateSlug(title);
    expect(slug).toBe('hello-world-a-test-title');
  });
});
