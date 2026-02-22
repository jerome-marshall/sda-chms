import type * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="fade-in slide-in-from-bottom-4 flex min-h-0 flex-1 animate-in flex-col gap-4 p-6 pt-2 duration-500">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
