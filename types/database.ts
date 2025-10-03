export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type PainPointStatus = 'pending' | 'approved' | 'rejected' | 'converted_to_issue';
export type IssueState = 'open' | 'closed';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type NewsletterStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';
export type SendStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'complained';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: SubscriptionTier;
          subscription_status: SubscriptionStatus;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      repositories: {
        Row: {
          id: string;
          user_id: string;
          github_repo_id: number;
          owner: string;
          name: string;
          full_name: string;
          description: string | null;
          url: string;
          primary_language: string | null;
          is_active: boolean;
          last_scanned_at: string | null;
          github_access_token_encrypted: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_repo_id: number;
          owner: string;
          name: string;
          full_name: string;
          description?: string | null;
          url: string;
          primary_language?: string | null;
          is_active?: boolean;
          last_scanned_at?: string | null;
          github_access_token_encrypted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_repo_id?: number;
          owner?: string;
          name?: string;
          full_name?: string;
          description?: string | null;
          url?: string;
          primary_language?: string | null;
          is_active?: boolean;
          last_scanned_at?: string | null;
          github_access_token_encrypted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      icp_personas: {
        Row: {
          id: string;
          repository_id: string;
          title: string;
          demographics: Json;
          goals: string[];
          pain_points: string[];
          motivations: string[];
          use_cases: string[];
          technical_profile: Json;
          generated_by_ai: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          title: string;
          demographics?: Json;
          goals?: string[];
          pain_points?: string[];
          motivations?: string[];
          use_cases?: string[];
          technical_profile?: Json;
          generated_by_ai?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          title?: string;
          demographics?: Json;
          goals?: string[];
          pain_points?: string[];
          motivations?: string[];
          use_cases?: string[];
          technical_profile?: Json;
          generated_by_ai?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subreddits: {
        Row: {
          id: string;
          icp_persona_id: string;
          name: string;
          display_name: string;
          description: string | null;
          subscribers: number;
          relevance_score: number;
          is_active: boolean;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          icp_persona_id: string;
          name: string;
          display_name: string;
          description?: string | null;
          subscribers?: number;
          relevance_score?: number;
          is_active?: boolean;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          icp_persona_id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          subscribers?: number;
          relevance_score?: number;
          is_active?: boolean;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pain_points: {
        Row: {
          id: string;
          subreddit_id: string;
          icp_persona_id: string;
          title: string;
          description: string;
          category: string | null;
          severity: SeverityLevel;
          frequency: number;
          source_posts: Json;
          status: PainPointStatus;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subreddit_id: string;
          icp_persona_id: string;
          title: string;
          description: string;
          category?: string | null;
          severity?: SeverityLevel;
          frequency?: number;
          source_posts?: Json;
          status?: PainPointStatus;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subreddit_id?: string;
          icp_persona_id?: string;
          title?: string;
          description?: string;
          category?: string | null;
          severity?: SeverityLevel;
          frequency?: number;
          source_posts?: Json;
          status?: PainPointStatus;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      github_issues: {
        Row: {
          id: string;
          repository_id: string;
          pain_point_id: string | null;
          github_issue_id: number;
          issue_number: number;
          title: string;
          body: string | null;
          labels: string[];
          state: IssueState;
          url: string;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          repository_id: string;
          pain_point_id?: string | null;
          github_issue_id: number;
          issue_number: number;
          title: string;
          body?: string | null;
          labels?: string[];
          state?: IssueState;
          url: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          repository_id?: string;
          pain_point_id?: string | null;
          github_issue_id?: number;
          issue_number?: number;
          title?: string;
          body?: string | null;
          labels?: string[];
          state?: IssueState;
          url?: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          repository_id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          meta_description: string | null;
          tags: string[];
          status: ContentStatus;
          view_count: number;
          generated_by_ai: boolean;
          repository_activity_summary: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          title: string;
          slug: string;
          content: string;
          excerpt?: string | null;
          meta_description?: string | null;
          tags?: string[];
          status?: ContentStatus;
          view_count?: number;
          generated_by_ai?: boolean;
          repository_activity_summary?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string | null;
          meta_description?: string | null;
          tags?: string[];
          status?: ContentStatus;
          view_count?: number;
          generated_by_ai?: boolean;
          repository_activity_summary?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_subscribers: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          status: SubscriberStatus;
          verification_token: string | null;
          verified_at: string | null;
          unsubscribed_at: string | null;
          source: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          status?: SubscriberStatus;
          verification_token?: string | null;
          verified_at?: string | null;
          unsubscribed_at?: string | null;
          source?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          status?: SubscriberStatus;
          verification_token?: string | null;
          verified_at?: string | null;
          unsubscribed_at?: string | null;
          source?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletters: {
        Row: {
          id: string;
          repository_id: string;
          blog_post_id: string | null;
          subject: string;
          html_content: string;
          text_content: string;
          status: NewsletterStatus;
          scheduled_for: string | null;
          sent_at: string | null;
          total_sent: number;
          open_count: number;
          click_count: number;
          bounce_count: number;
          generated_by_ai: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          blog_post_id?: string | null;
          subject: string;
          html_content: string;
          text_content: string;
          status?: NewsletterStatus;
          scheduled_for?: string | null;
          sent_at?: string | null;
          total_sent?: number;
          open_count?: number;
          click_count?: number;
          bounce_count?: number;
          generated_by_ai?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          blog_post_id?: string | null;
          subject?: string;
          html_content?: string;
          text_content?: string;
          status?: NewsletterStatus;
          scheduled_for?: string | null;
          sent_at?: string | null;
          total_sent?: number;
          open_count?: number;
          click_count?: number;
          bounce_count?: number;
          generated_by_ai?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      severity_level: SeverityLevel;
      pain_point_status: PainPointStatus;
      issue_state: IssueState;
      content_status: ContentStatus;
      newsletter_status: NewsletterStatus;
      subscriber_status: SubscriberStatus;
      send_status: SendStatus;
    };
  };
}
