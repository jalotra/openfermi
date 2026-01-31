"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider as SidebarContextProvider } from "@/components/canvas/SidebarContext";
import { GlobalSidebar } from "@/components/canvas/GlobalSidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarContextProvider>
      <SidebarProvider className="h-screen">
        <GlobalSidebar />
        <main className="flex flex-1 min-w-0 flex-col relative overflow-hidden">
          <header className="flex h-10 shrink-0 items-center gap-2 border-b border-sidebar-border px-2 bg-background">
            <SidebarTrigger />
          </header>
          <div className="flex-1 min-w-0 overflow-auto">{children}</div>
        </main>
      </SidebarProvider>
    </SidebarContextProvider>
  );
}
