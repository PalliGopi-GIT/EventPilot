import { google } from "googleapis";
import { prisma } from "../db/prisma";
import { encryptToken, decryptToken } from "../security/encryption";

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
];

export function getGoogleOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables. Please check .env"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google OAuth 2.0 authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: REQUIRED_SCOPES,
    prompt: "consent", // Force consent to ensure refresh token is returned
    state: state || "",
    include_granted_scopes: true,
  });
}

/**
 * Exchange authorization code for tokens and save to user's GoogleConnection
 */
export async function handleOAuthCallback(code: string, userId: string) {
  const oauth2Client = getGoogleOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  // Fetch Google User Profile info
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const googleEmail = userInfo.data.email || "unknown@gmail.com";
  const googleName = userInfo.data.name;
  const googleAvatar = userInfo.data.picture;

  if (!tokens.access_token) {
    throw new Error("No access token received from Google OAuth");
  }

  const encryptedAccess = encryptToken(tokens.access_token);
  let encryptedRefresh = null;

  if (tokens.refresh_token) {
    encryptedRefresh = encryptToken(tokens.refresh_token);
  }

  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  const scopesStr = (tokens.scope || REQUIRED_SCOPES.join(" ")).split(" ").join(",");

  // Update or create User profile and GoogleConnection
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: googleEmail,
      name: googleName || undefined,
      avatarUrl: googleAvatar || undefined,
    },
    create: {
      id: userId,
      email: googleEmail,
      name: googleName,
      avatarUrl: googleAvatar,
    },
  });

  const connection = await prisma.googleConnection.upsert({
    where: { userId },
    update: {
      googleEmail,
      encryptedAccessToken: encryptedAccess.encrypted,
      accessTokenIv: encryptedAccess.iv,
      accessTokenTag: encryptedAccess.tag,
      ...(encryptedRefresh
        ? {
            encryptedRefreshToken: encryptedRefresh.encrypted,
            refreshTokenIv: encryptedRefresh.iv,
            refreshTokenTag: encryptedRefresh.tag,
          }
        : {}),
      tokenExpiry,
      scopes: scopesStr,
    },
    create: {
      userId,
      googleEmail,
      encryptedAccessToken: encryptedAccess.encrypted,
      accessTokenIv: encryptedAccess.iv,
      accessTokenTag: encryptedAccess.tag,
      encryptedRefreshToken: encryptedRefresh?.encrypted,
      refreshTokenIv: encryptedRefresh?.iv,
      refreshTokenTag: encryptedRefresh?.tag,
      tokenExpiry,
      scopes: scopesStr,
    },
  });

  return {
    googleEmail,
    googleName,
    connectionId: connection.id,
  };
}

/**
 * Retrieve authenticated Google OAuth client for a specific user.
 * Automatically handles token decryption and refresh when expired.
 */
export async function getAuthenticatedClientForUser(userId: string) {
  const connection = await prisma.googleConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("No connected Google account found for this user. Please connect Google OAuth.");
  }

  const oauth2Client = getGoogleOAuth2Client();

  const accessToken = decryptToken(
    connection.encryptedAccessToken,
    connection.accessTokenIv,
    connection.accessTokenTag
  );

  let refreshToken: string | undefined = undefined;
  if (
    connection.encryptedRefreshToken &&
    connection.refreshTokenIv &&
    connection.refreshTokenTag
  ) {
    refreshToken = decryptToken(
      connection.encryptedRefreshToken,
      connection.refreshTokenIv,
      connection.refreshTokenTag
    );
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: connection.tokenExpiry?.getTime(),
  });

  // Check if token is expired or expiring within 60 seconds
  const isExpired =
    connection.tokenExpiry && connection.tokenExpiry.getTime() <= Date.now() + 60000;

  if (isExpired && refreshToken) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const newTokens = refreshed.credentials;

      if (newTokens.access_token) {
        const encAccess = encryptToken(newTokens.access_token);
        const encRefresh = newTokens.refresh_token ? encryptToken(newTokens.refresh_token) : null;

        await prisma.googleConnection.update({
          where: { userId },
          data: {
            encryptedAccessToken: encAccess.encrypted,
            accessTokenIv: encAccess.iv,
            accessTokenTag: encAccess.tag,
            ...(encRefresh
              ? {
                  encryptedRefreshToken: encRefresh.encrypted,
                  refreshTokenIv: encRefresh.iv,
                  refreshTokenTag: encRefresh.tag,
                }
              : {}),
            tokenExpiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
          },
        });
      }
    } catch (refreshErr) {
      console.error("Failed to refresh Google OAuth token:", refreshErr);
      throw new Error(
        "Google OAuth session expired. Please reconnect your Google account in Settings."
      );
    }
  }

  return {
    oauth2Client,
    googleEmail: connection.googleEmail,
  };
}
