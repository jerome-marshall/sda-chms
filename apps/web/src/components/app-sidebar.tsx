import { Link } from "@tanstack/react-router";
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
import type { TRoutes } from "@/types/route";
import { Separator } from "./ui/separator";

// Church Management System navigation data
interface NavItem {
  title: string;
  url: TRoutes;
  icon: LucideIcon;
  items?: Array<{
    title: string;
    url: TRoutes;
    isActive?: boolean;
  }>;
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "People",
      url: "/people",
      icon: Users2,
    },
    {
      title: "Events",
      url: "/example",
      icon: Calendar,
    },
    {
      title: "Giving",
      url: "/",
      icon: CreditCard,
    },
    {
      title: "Reports",
      url: "/example",
      icon: BarChart,
    },
    {
      title: "Settings",
      url: "/example",
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
                <Link to="/" {...props}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Church className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">SDA</span>
                    <span className="">Church Management</span>
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
