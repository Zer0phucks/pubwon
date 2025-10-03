CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"seo_metadata" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"pain_point_id" uuid,
	"github_issue_number" integer NOT NULL,
	"github_issue_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"url" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"labels" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "icp_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"name" text NOT NULL,
	"demographics" jsonb,
	"goals" jsonb,
	"pain_points" jsonb,
	"use_cases" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"blog_post_id" uuid,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"sent_at" timestamp,
	"recipient_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pain_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icp_persona_id" uuid NOT NULL,
	"reddit_discussion_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"severity" text,
	"frequency" integer DEFAULT 1,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reddit_discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subreddit_id" uuid NOT NULL,
	"reddit_post_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"url" text NOT NULL,
	"author" text,
	"score" integer,
	"num_comments" integer,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reddit_discussions_reddit_post_id_unique" UNIQUE("reddit_post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"analysis_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subreddits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icp_persona_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subscribers" integer,
	"relevance_score" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"github_id" text,
	"github_username" text,
	"github_access_token" text,
	"preferred_ai_model" text DEFAULT 'gpt-4o-mini',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_pain_point_id_pain_points_id_fk" FOREIGN KEY ("pain_point_id") REFERENCES "public"."pain_points"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "icp_personas" ADD CONSTRAINT "icp_personas_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_icp_persona_id_icp_personas_id_fk" FOREIGN KEY ("icp_persona_id") REFERENCES "public"."icp_personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_reddit_discussion_id_reddit_discussions_id_fk" FOREIGN KEY ("reddit_discussion_id") REFERENCES "public"."reddit_discussions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reddit_discussions" ADD CONSTRAINT "reddit_discussions_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subreddits" ADD CONSTRAINT "subreddits_icp_persona_id_icp_personas_id_fk" FOREIGN KEY ("icp_persona_id") REFERENCES "public"."icp_personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_posts_repository_id_idx" ON "blog_posts" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_subscribers_email_idx" ON "email_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_repository_id_idx" ON "github_issues" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_pain_point_id_idx" ON "github_issues" USING btree ("pain_point_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "icp_personas_repository_id_idx" ON "icp_personas" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletters_repository_id_idx" ON "newsletters" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pain_points_icp_persona_id_idx" ON "pain_points" USING btree ("icp_persona_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pain_points_status_idx" ON "pain_points" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reddit_discussions_subreddit_id_idx" ON "reddit_discussions" USING btree ("subreddit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reddit_discussions_scraped_at_idx" ON "reddit_discussions" USING btree ("scraped_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "repositories_user_id_idx" ON "repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subreddits_icp_persona_id_idx" ON "subreddits" USING btree ("icp_persona_id");