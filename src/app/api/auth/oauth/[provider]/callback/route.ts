import { NextResponse, type NextRequest } from 'next/server';
import { OAUTH_TX_COOKIE } from '@/shared/constants';
import { oauthProviderSchema } from '@/shared/schemas';
import {
  buildOAuthCallbackUrl,
  clearFacebookPendingCookie,
  clearOAuthTxCookie,
  exchangeFacebookCode,
  exchangeGoogleCode,
  getOAuthCredentials,
  sanitizeNextPath,
  setFacebookPendingCookie,
  signFacebookPendingToken,
  verifyOAuthTxToken,
} from '@/server/auth/oauth';
import { readCookieFromRequest, setSessionCookie, signSessionToken } from '@/server/auth/session';
import { resolveDeploymentOrigin } from '@/server/security/origin-check';
import { resolveFacebookOAuthLogin, upsertOAuthUser } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redirectWithClearedTx(url: URL): NextResponse {
  const response = NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  });
  clearOAuthTxCookie(response);
  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: rawProvider } = await context.params;
  const origin = resolveDeploymentOrigin(request);

  const txCookie = readCookieFromRequest(request, OAUTH_TX_COOKIE);
  const tx = txCookie ? await verifyOAuthTxToken(txCookie) : null;
  const fallbackNext = sanitizeNextPath(tx?.next);

  const buildErrorUrl = (code: string) => {
    const target = new URL(fallbackNext, origin);
    target.searchParams.set('authError', code);
    return target;
  };

  const parsedProvider = oauthProviderSchema.safeParse(rawProvider);
  if (!parsedProvider.success) {
    return redirectWithClearedTx(buildErrorUrl('failed'));
  }
  const provider = parsedProvider.data;

  if (request.nextUrl.searchParams.get('error')) {
    return redirectWithClearedTx(buildErrorUrl('cancelled'));
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
  const state = request.nextUrl.searchParams.get('state')?.trim() ?? '';

  if (!tx || tx.provider !== provider || !state || state !== tx.state || !code) {
    return redirectWithClearedTx(buildErrorUrl('invalid_state'));
  }

  const credentials = getOAuthCredentials(provider);
  if (!credentials) {
    return redirectWithClearedTx(buildErrorUrl('not_configured'));
  }

  try {
    const redirectUri = buildOAuthCallbackUrl(request, provider);
    const profile =
      provider === 'google'
        ? await exchangeGoogleCode({
            code,
            redirectUri,
            codeVerifier: tx.codeVerifier ?? '',
            credentials,
          })
        : await exchangeFacebookCode({
            code,
            redirectUri,
            credentials,
          });

    if (provider === 'google') {
      const user = await upsertOAuthUser(profile);
      const sessionToken = await signSessionToken(user);

      const response = redirectWithClearedTx(new URL(tx.next, origin));
      setSessionCookie(response, sessionToken, user.role);
      clearFacebookPendingCookie(response);
      return response;
    }

    const resolution = await resolveFacebookOAuthLogin(profile);
    if (resolution.status === 'authenticated') {
      const sessionToken = await signSessionToken(resolution.user);
      const response = redirectWithClearedTx(new URL(tx.next, origin));
      setSessionCookie(response, sessionToken, resolution.user.role);
      clearFacebookPendingCookie(response);
      return response;
    }

    const pendingToken = await signFacebookPendingToken({
      providerAccountId: profile.providerAccountId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      next: tx.next,
    });
    const verifyUrl = new URL(tx.next, origin);
    verifyUrl.searchParams.set('authStep', 'facebook_email');

    const response = redirectWithClearedTx(verifyUrl);
    setFacebookPendingCookie(response, pendingToken);
    return response;
  } catch (error) {
    console.error(`[oauth/${provider}] callback failed:`, error);
    return redirectWithClearedTx(buildErrorUrl('failed'));
  }
}
