import { NextResponse } from 'next/server';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&gcal_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&gcal_error=no_code`
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
    
    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Redirect back to settings with tokens in URL (client will handle storage)
    // Using hash fragment so tokens don't get logged in server logs
    const tokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry,
    };
    
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&gcal_success=true#gcal_tokens=${encodeURIComponent(JSON.stringify(tokenData))}`
    );
  } catch (err) {
    console.error('Google Calendar OAuth error:', err);
    return NextResponse.redirect(
      `${origin}/settings?section=integrations&gcal_error=${encodeURIComponent(
        err instanceof Error ? err.message : 'Unknown error'
      )}`
    );
  }
}
