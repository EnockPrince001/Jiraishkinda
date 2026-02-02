import { Outlet, NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Palette,
  Bell,
  ArrowLeft,
} from "lucide-react";

export default function AccountSettingsLayout() {
  const sidebarItems = [
    { icon: User, label: "Profile", href: "/settings/profile" },
    { icon: Shield, label: "Security", href: "/settings/security" },
    { icon: Bell, label: "Notifications", href: "/settings/notifications" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b h-14 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account settings
            </h2>

            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}
