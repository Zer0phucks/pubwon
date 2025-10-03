/**
 * GitHub OAuth callback handler
 * Phase 3.1: GitHub Connection
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/encryption';
import { GitHubClient } from '@/lib/github/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL('/profile?error=missing_code', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info
    const githubClient = new GitHubClient(accessToken);
    const githubUser = await githubClient.getUser();

    // Get current user from session (you'll need to implement session management)
    // For now, we'll use the state parameter to identify the user
    const userId = state; // In production, validate this properly

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Encrypt GitHub access token
    const encryptedToken = encrypt(accessToken);

    // Update user record with GitHub info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        github_username: githubUser.login,
        github_access_token: encryptedToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Redirect to repository selection page
    return NextResponse.redirect(
      new URL('/onboarding/repositories', process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/profile?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  }
}
