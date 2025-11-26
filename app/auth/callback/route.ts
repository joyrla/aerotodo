import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/';
  
  // Just redirect to the destination - the client-side Supabase
  // will detect the session from the URL hash via detectSessionInUrl
  return NextResponse.redirect(new URL(next, request.url));
}
