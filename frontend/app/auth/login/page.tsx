"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Chrome } from "lucide-react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function AuthPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });

      if (result?.error) {
        setError("Sign in failed. Please try again.");
        return;
      }

      const session = await authClient.getSession();
      const email = session?.data?.user?.email;
      const name = session?.data?.user?.name;

      if (email) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (process.env.NEXT_PUBLIC_API_KEY) {
          headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
        }

        const syncRes = await fetch(`${BACKEND_URL}/api/users/sync`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            email,
            name: name || "",
            avatarUrl: session?.data?.user?.image || "",
            provider: "google",
            providerId: session?.data?.user?.id || "",
          }),
        });

        if (syncRes.status === 403) {
          await authClient.signOut();
          const params = new URLSearchParams({ email, name: name || "" });
          router.push(`/auth/not-approved?${params.toString()}`);
          return;
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to OpenFermi</CardTitle>
          <CardDescription>
            Sign in to access your practice sessions and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-2 h-5 w-5" />
            {isLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
