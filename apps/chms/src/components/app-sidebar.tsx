import { Link } from "@tanstack/react-router";
import { Church, CreditCard, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { TRoutes } from "@/types/route";

import { Separator } from "./ui/separator";

// Church Management System navigation data
interface NavItem {
  icon: LucideIcon;
  items?: {
    title: string;
    url: TRoutes;
    isActive?: boolean;
  }[];
  title: string;
  url: TRoutes;
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "People",
      url: "/people",
      icon: Users2,
    },
    {
      title: "Giving",
      url: "/",
      icon: CreditCard,
    },
  ],
};

export function AppSidebar({
  ...sidebarProps
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" {...sidebarProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={(props) => (
                <Link
                  to="/"
                  {...props}
                  className={cn(props.className, "h-10 py-0")}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Church className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">SDA Church</span>
                  </div>
                </Link>
              )}
              size="lg"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator className={"px-3"} />
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <Link to={item.url} {...props}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
