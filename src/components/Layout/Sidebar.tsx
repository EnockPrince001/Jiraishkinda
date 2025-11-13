import { Home, Layout, List, Folder, BarChart3, ChevronRight, Plus } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; // 1. IMPORT useNavigate
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const spaces = [
  { name: "POS QE TEAM", icon: Home, color: "bg-blue-500" },
  { name: "Sababisha POS", icon: Folder, color: "bg-cyan-500" },
];

const navItems = [
  { title: "For you", icon: Home, url: "/" },
  { title: "Recent", icon: Layout, url: "/recent" },
  { title: "Starred", icon: Layout, url: "/starred" },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate(); // 2. INITIALIZE the navigate function

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spaces Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {open && "Spaces"}
            </SidebarGroupLabel>
            {open && (
              // 3. ADD the onClick handler here
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => navigate('/create-space')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarGroupLabel className="text-xs font-normal text-muted-foreground px-3">
                  {open && "Recent"}
                </SidebarGroupLabel>
              </SidebarMenuItem>
              {spaces.map((space) => (
                <SidebarMenuItem key={space.name}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/space/${space.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <div className={`h-5 w-5 rounded flex items-center justify-center ${space.color}`}>
                        <space.icon className="h-3 w-3 text-white" />
                      </div>
                      {open && <span className="truncate">{space.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional Navigation */}
        {open && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-muted-foreground hover:bg-sidebar-accent">
                    <ChevronRight className="h-4 w-4" />
                    <span>More spaces</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-muted-foreground hover:bg-sidebar-accent">
                    <Layout className="h-4 w-4" />
                    <span>Browse templates</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-muted-foreground hover:bg-sidebar-accent">
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboards</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}