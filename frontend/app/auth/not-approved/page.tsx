"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, Send } from "lucide-react";

function WaitlistFormContent() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const prefillName = searchParams.get("name") || "";

  const [name, setName] = useState(prefillName);
  const [email] = useState(prefillEmail);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkExisting = async () => {
      if (!email) {
        setChecked(true);
        return;
      }

      try {
        const res = await fetch(`/api/waitlist?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = (await res.json()) as { exists?: boolean };
          setAlreadySubmitted(data.exists === true);
        }
      } catch {
        // If lookup fails, allow user to submit from UI.
      } finally {
        setChecked(true);
      }
    };

    checkExisting();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, name, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">
              Request Received
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Thanks for your interest in Tars and Tars! We&apos;ve received
              your request and you&apos;ll be onboarded shortly after review.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Clock className="h-3.5 w-3.5" />
              <span>
                You&apos;ll receive access once approved.
                <br />
                We would send out an email to you once you are approved.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Request Access</CardTitle>
          <CardDescription>
            Thanks for your interest in Tars and Tars! Please fill in your
            details below and we&apos;ll get back to you shortly.
            <b>Team is small right now, with limited resources.</b> We&apos;ll
            do our best to get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Tell us about yourself</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What are you studying? Why are you interested in Tars?"
                rows={4}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotApprovedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitlistFormContent />
    </Suspense>
  );
}
