"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider as SidebarContextProvider } from "@/components/canvas/SidebarContext";
import { GlobalSidebar } from "@/components/canvas/GlobalSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  userName?: string;
  userAvatarUrl?: string;
  userEmail?: string;
}

export function DashboardLayout({
  children,
  isAdmin = false,
  userName,
  userAvatarUrl,
  userEmail,
}: DashboardLayoutProps) {
  return (
    <SidebarContextProvider>
      <SidebarProvider className="h-screen">
        <GlobalSidebar
          isAdmin={isAdmin}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          userEmail={userEmail}
        />
        <main className="flex flex-1 min-w-0 flex-col relative overflow-hidden">
          <header className="flex h-10 shrink-0 items-center gap-2 border-b border-sidebar-border px-2 bg-background">
            <SidebarTrigger />
          </header>
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </SidebarContextProvider>
  );
}
