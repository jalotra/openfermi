import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Helper function to sync user data to Spring Boot backend
async function syncUserToBackend(user: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        avatarUrl: user.image,
        provider: "google",
        providerId: user.id,
      }),
    });

    if (!response.ok) {
      console.error("Failed to sync user to backend:", await response.text());
    }
  } catch (error) {
    console.error("Error syncing user to backend:", error);
  }
}

export const auth = betterAuth({
  // No database configuration - using stateless mode
  // Sessions are stored in signed/encrypted cookies only
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Stateless session management with JWT cookies
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      strategy: "jwt", // JWT format for better interoperability
      refreshCache: true,
    },
  },

  // Account configuration for OAuth
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },

  // Google OAuth provider
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },



  // Enable Next.js cookies plugin (must be last in plugins array)
  plugins: [nextCookies()],
});

export type AuthType = typeof auth;
