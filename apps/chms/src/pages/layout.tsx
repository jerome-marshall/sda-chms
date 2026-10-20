import { AppLayout } from "@/components/app-layout";
import { BreadcrumbProvider } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "../index.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <TooltipProvider delayDuration={300}>
        <BreadcrumbProvider>
          <AppLayout>{children}</AppLayout>
        </BreadcrumbProvider>
      </TooltipProvider>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
