import { Search, Plus, Bell, HelpCircle, Settings, User, LogOut, Moon, Sun, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

interface TopNavBarProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopNavBar({ sidebarCollapsed, onToggleSidebar }: TopNavBarProps) {
  // Destructure only what exists on AuthContextType
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract display values safely from the user object
  // This ensures that when the user object updates, displayName updates too
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-nav-border bg-nav">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-foreground hover:bg-nav-hover"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <span className="text-sm font-bold text-primary-foreground">W</span>
          </div>
          <span className="hidden font-semibold sm:inline-block">Worknest</span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="w-full pl-10 bg-background border-input"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
            <span>Add payment details</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
          </Button>

          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/spaces")}>
            <Settings className="h-5 w-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Profile */}
            <DropdownMenuItem asChild>
              <Link
                to="/settings/profile"
                className={`flex items-center w-full ${
                  isActive("/settings/profile") ? "bg-muted font-medium" : ""
                }`}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            {/* Account Settings */}
            <DropdownMenuItem asChild>
              <Link
                to="/settings/profile"
                className={`flex items-center w-full ${
                  isActive("/settings") ? "bg-muted font-medium" : ""
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "light" ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </DropdownMenuItem>

            {/* Switch Account */}
            <DropdownMenuItem asChild>
              <Link
                to="/settings/spaces"
                className={`flex items-center w-full ${
                  isActive("/settings/spaces") ? "bg-muted font-medium" : ""
                }`}
              >
                <span>Switch Account</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}