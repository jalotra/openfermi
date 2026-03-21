"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.NEXT_PUBLIC_API_KEY) {
    headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
  }
  return headers;
}

interface WaitlistItem {
  id: string;
  email: string;
  name: string;
  message: string;
  status: string;
  createdAt?: string;
}

interface AdminInviteClientProps {
  initialWaitlist: WaitlistItem[];
}

export function AdminInviteClient({ initialWaitlist }: AdminInviteClientProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>(initialWaitlist);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);

    try {
      const res = await fetch("/api/email/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to invite user");
      }

      toast.success(`Invited ${inviteEmail} — welcome email sent`);
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleApprove = async (item: WaitlistItem) => {
    setProcessingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await fetch("/api/email/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          email: item.email,
          name: item.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to approve");
      }

      setWaitlist((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, status: "APPROVED" } : w)),
      );
      toast.success("User approved — approval email sent");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve request",
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/waitlist/${id}/reject`,
        {
          method: "PUT",
          headers: getHeaders(),
        },
      );

      if (!res.ok) throw new Error("Failed to reject");

      setWaitlist((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "REJECTED" } : w)),
      );
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const pendingRequests = waitlist.filter((w) => w.status === "PENDING");

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite by Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={isInviting}>
              <Mail className="mr-2 h-4 w-4" />
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Waitlist Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary">
                {pendingRequests.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitlist.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No waitlist requests yet.
            </p>
          ) : (
            <div className="space-y-4">
              {waitlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {item.name || "No name"}
                      </h4>
                      <Badge
                        variant={
                          item.status === "APPROVED"
                            ? "default"
                            : item.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.email}
                    </p>
                    {item.message && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {item.message}
                      </p>
                    )}
                    {item.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </div>
                  {item.status === "PENDING" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item)}
                        disabled={processingIds.has(item.id)}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(item.id)}
                        disabled={processingIds.has(item.id)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
