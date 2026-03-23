import { getServerUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { NewAgentSessionForm } from "./NewAgentSessionForm";

export default async function NewAgentSessionPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id || user.email || "";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              New Agent Session
            </h1>
            <p className="text-muted-foreground">
              Describe what you need help with and an AI agent will be spun up
              to assist you.
            </p>
          </div>
          <NewAgentSessionForm userId={userId} />
        </div>
      </div>
    </div>
  );
}
