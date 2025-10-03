export interface Database {
  public: {
    Tables: {
      repository_activity: {
        Row: RepositoryActivity;
        Insert: Omit<RepositoryActivity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RepositoryActivity, 'id' | 'created_at'>>;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BlogPost, 'id' | 'created_at'>>;
      };
      newsletters: {
        Row: Newsletter;
        Insert: Omit<Newsletter, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Newsletter, 'id' | 'created_at'>>;
      };
      email_subscribers: {
        Row: EmailSubscriber;
        Insert: Omit<EmailSubscriber, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EmailSubscriber, 'id' | 'created_at'>>;
      };
      email_events: {
        Row: EmailEvent;
        Insert: Omit<EmailEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<EmailEvent, 'id'>>;
      };
    };
  };
}

export interface RepositoryActivity {
  id: string;
  user_id: string;
  repository_id: string;
  activity_date: string;
  commits_count: number;
  prs_merged_count: number;
  issues_closed_count: number;
  releases_count: number;
  activity_summary: ActivitySummary | null;
  is_significant: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivitySummary {
  commits: GitHubCommit[];
  pull_requests: GitHubPullRequest[];
  issues: GitHubIssue[];
  releases: GitHubRelease[];
  contributors: string[];
  files_changed: string[];
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  merged_at: string;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  closed_at: string;
  url: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  url: string;
}

export interface BlogPost {
  id: string;
  user_id: string;
  repository_id: string;
  activity_id: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  featured_image_url: string | null;
  code_snippets: CodeSnippet[] | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

export interface Newsletter {
  id: string;
  user_id: string;
  blog_post_id: string | null;
  subject_line: string;
  preview_text: string | null;
  html_content: string;
  text_content: string;
  personalization_tokens: PersonalizationTokens | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationTokens {
  [key: string]: string;
}

export interface EmailSubscriber {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscription_source: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface EmailEvent {
  id: string;
  newsletter_id: string;
  subscriber_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  event_data: Record<string, any> | null;
  created_at: string;
}
