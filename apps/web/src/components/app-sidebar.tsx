import {
  BarChart,
  Calendar,
  Church,
  CreditCard,
  type LucideIcon,
  Settings,
  Users2,
} from "lucide-react";
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

// Church Management System navigation data
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: Array<{
    title: string;
    url: string;
    isActive?: boolean;
  }>;
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Members",
      url: "/members",
      icon: Users2,
    },
    {
      title: "Events",
      url: "/events",
      icon: Calendar,
    },
    {
      title: "Giving",
      url: "/giving",
      icon: CreditCard,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={(props) => (
                <a href="/" {...props}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Church className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">SDA</span>
                    <span className="">Church Management</span>
                  </div>
                </a>
              )}
              size="lg"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <a href={item.url} {...props}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
