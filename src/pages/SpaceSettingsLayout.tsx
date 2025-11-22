import { Outlet, NavLink, useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    Settings,
    Users,
    Bell,
    Zap,
    Layout,
    Box,
    Puzzle,
    ArrowLeft
} from "lucide-react";

export default function SpaceSettingsLayout() {
    const { spaceKey } = useParams();

    const sidebarItems = [
        { icon: Settings, label: "Details", href: `/spaces/${spaceKey}/settings/details` },
        { icon: Users, label: "Access", href: `/spaces/${spaceKey}/settings/access` },
        { icon: Bell, label: "Notifications", href: `/spaces/${spaceKey}/settings/notifications` },
        { icon: Zap, label: "Automation", href: `/spaces/${spaceKey}/settings/automation` },
        { icon: Layout, label: "Board", href: `/spaces/${spaceKey}/settings/board` },
        { icon: Box, label: "Features", href: `/spaces/${spaceKey}/settings/features` },
        { icon: Puzzle, label: "Apps", href: `/spaces/${spaceKey}/settings/apps` },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b h-14 flex items-center">
                    <Link to={`/spaces/${spaceKey}/board`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to project
                    </Link>
                </div>
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Space settings
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

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
