import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function getBackendHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.NEXT_PUBLIC_API_KEY) {
    headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
  }
  return headers;
}

async function syncUserToBackend(user: any): Promise<{ approved: boolean }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/sync`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        avatarUrl: user.image,
        provider: "google",
        providerId: user.id,
      }),
    });

    if (response.status === 403) {
      return { approved: false };
    }

    if (!response.ok) {
      console.error("Failed to sync user to backend:", await response.text());
      return { approved: false };
    }

    return { approved: true };
  } catch (error) {
    console.error("Error syncing user to backend:", error);
    return { approved: false };
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwt",
      refreshCache: true,
    },
  },

  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await syncUserToBackend(user);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Session created -- sync happens on user create
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export { syncUserToBackend };
export type AuthType = typeof auth;
