import { Home, Layout, Folder, ChevronRight, Plus, User as UserIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_ME } from "@/lib/queries";

interface Space {
  role: string;
  space: {
    id: string;
    name: string;
    key: string;
    type: 'SCRUM' | 'KANBAN';
  };
}

const navItems = [
  { title: "For you", icon: Home, url: "/" },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  // Destructure 'user' from useAuth to show live name/title updates
  const { user, token } = useAuth(); 
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [showAllSpaces, setShowAllSpaces] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const client = getGraphQLClient(token || undefined);
        const data: any = await client.request(GET_ME);
        setSpaces(data.me?.[0]?.spaces || []);
      } catch (error) {
        console.error("Failed to fetch spaces:", error);
      }
    };

    fetchSpaces();
  }, [token]);

  const displayedSpaces = showAllSpaces ? spaces : spaces.slice(0, 3);
  const hasMoreSpaces = spaces.length > 3;

  return (
    <Sidebar className="w-full h-full" collapsible="none">
      <SidebarContent>
        {/* --- USER PROFILE SECTION --- */}
        <SidebarGroup className="border-b border-sidebar-border pb-4 mb-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-bold">
                {user?.name?.substring(0, 1).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
              <span className="truncate font-semibold">
                {user?.name || "User"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.jobTitle || "No title set"}
              </span>
            </div>
          </div>
        </SidebarGroup>

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
                      <span>{item.title}</span>
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
              Spaces
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => navigate('/create-space')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayedSpaces.length > 0 && (
                <SidebarMenuItem>
                  <SidebarGroupLabel className="text-xs font-normal text-muted-foreground px-3">
                    Recent
                  </SidebarGroupLabel>
                </SidebarMenuItem>
              )}
              {displayedSpaces.map((item) => {
                const bgColors = ['bg-blue-500', 'bg-cyan-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];
                const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];

                return (
                  <SidebarMenuItem key={item.space.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/spaces/${item.space.key}/board`}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <div className={`h-5 w-5 rounded flex items-center justify-center ${randomColor}`}>
                          <Folder className="h-3 w-3 text-white" />
                        </div>
                        <span className="truncate">{item.space.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional Navigation */}
        {hasMoreSpaces && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowAllSpaces(!showAllSpaces)}
                    className="text-muted-foreground hover:bg-sidebar-accent"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${showAllSpaces ? 'rotate-90' : ''}`} />
                    <span>{showAllSpaces ? 'Show less' : `More spaces (${spaces.length - 3})`}</span>
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