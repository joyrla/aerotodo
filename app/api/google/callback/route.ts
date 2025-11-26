import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&error=no_code`
    );
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Token exchange failed');
    }

    const tokens = await tokenResponse.json();
    
    // Store tokens in user settings via Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(
        `${origin}/settings?section=integrations&error=not_authenticated`
      );
    }

    // Get current settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    const currentPrefs = settingsData?.preferences || {};
    
    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Update settings with Google Calendar tokens
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({
        preferences: {
          ...currentPrefs,
          googleCalendar: {
            enabled: true,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry,
            twoWaySync: false,
            syncAllTasks: false,
            syncTimeBlockedOnly: true,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&gcal=connected`
    );
  } catch (err) {
    console.error('Google Calendar OAuth error:', err);
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&error=${encodeURIComponent(
        err instanceof Error ? err.message : 'Unknown error'
      )}`
    );
  }
}

