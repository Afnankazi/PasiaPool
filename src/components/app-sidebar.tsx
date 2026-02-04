"use client"

import * as React from "react"
import {
  Home,
  Users,
  Receipt,
  Calculator,
  CreditCard,
  History,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavPayment } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

// Navigation data for the expense splitting app
const getNavigationData = (user: { name?: string | null; email?: string | null; image?: string | null } | undefined) => ({
  user: {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "", // Use empty string so fallback will show
  },
  teams: [
    {
      name: "PaisaPool",
      logo: Calculator,
      plan: "Expense Tracker",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Groups",
      url: "/dashboard/groups",
      icon: Users,
      items: [
        {
          title: "All Groups",
          url: "/dashboard/groups",
        },
        {
          title: "Create Group",
          url: "/dashboard/groups?create=true",
        },
      ],
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: Receipt,
      items: [
        {
          title: "All Expenses",
          url: "/dashboard/expenses",
        },
        {
          title: "Add Expense",
          url: "/dashboard/expenses/new",
        },
      ],
    },
    {
      title: "Settlements",
      url: "/dashboard/settlements",
      icon: CreditCard,
      items: [
        {
          title: "Pending",
          url: "/dashboard/settlements/pending",
        },
        {
          title: "History",
          url: "/dashboard/settlements/history",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Recent Activity",
      url: "/dashboard/payment",
      icon: History,
    },
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const data = getNavigationData(session?.user);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavPayment projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
