import { NextResponse, type NextRequest } from 'next/server';
import { oauthProviderSchema } from '@/shared/schemas';
import {
  buildFacebookAuthUrl,
  buildGoogleAuthUrl,
  buildOAuthCallbackUrl,
  createPkcePair,
  generateOAuthState,
  getOAuthCredentials,
  sanitizeNextPath,
  setOAuthTxCookie,
  signOAuthTxToken,
} from '@/server/auth/oauth';
import { resolveDeploymentOrigin } from '@/server/security/origin-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redirectWithAuthError(origin: string, nextPath: string, errorCode: string): NextResponse {
  const target = new URL(nextPath, origin);
  target.searchParams.set('authError', errorCode);
  return NextResponse.redirect(target, { status: 302, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: rawProvider } = await context.params;
  const origin = resolveDeploymentOrigin(request);
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'));

  const parsedProvider = oauthProviderSchema.safeParse(rawProvider);
  if (!parsedProvider.success) {
    return redirectWithAuthError(origin, nextPath, 'failed');
  }

  const provider = parsedProvider.data;
  const credentials = getOAuthCredentials(provider);
  if (!credentials) {
    return redirectWithAuthError(origin, nextPath, 'not_configured');
  }

  const state = generateOAuthState();
  const redirectUri = buildOAuthCallbackUrl(request, provider);

  if (provider === 'google') {
    const { codeVerifier, codeChallenge } = createPkcePair();
    const txToken = await signOAuthTxToken({
      provider,
      state,
      codeVerifier,
      next: nextPath,
    });
    const authUrl = buildGoogleAuthUrl({
      clientId: credentials.clientId,
      redirectUri,
      state,
      codeChallenge,
    });
    const response = NextResponse.redirect(authUrl, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    });
    setOAuthTxCookie(response, txToken);
    return response;
  }

  const txToken = await signOAuthTxToken({
    provider,
    state,
    next: nextPath,
  });
  const authUrl = buildFacebookAuthUrl({
    clientId: credentials.clientId,
    redirectUri,
    state,
  });
  const response = NextResponse.redirect(authUrl, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  });
  setOAuthTxCookie(response, txToken);
  return response;
}
