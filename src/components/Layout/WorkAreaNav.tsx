import { NavLink } from "@/components/NavLink";
import { LayoutGrid, List, FolderKanban, BarChart3, MoreHorizontal, Share2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Board", icon: LayoutGrid, url: "/" },
  { title: "List", icon: List, url: "/list" },
  { title: "Backlog", icon: FolderKanban, url: "/backlog" },
  { title: "Reports", icon: BarChart3, url: "/reports" },
];

interface WorkAreaNavProps {
  spaceName?: string;
}

export function WorkAreaNav({ spaceName = "POS QE TEAM" }: WorkAreaNavProps) {
  return (
    <div className="border-b border-nav-border bg-nav">
      <div className="px-4 py-2">
        {/* Space Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            <h2 className="text-lg font-semibold">{spaceName}</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-nav-hover rounded-md transition-colors"
              activeClassName="text-primary border-b-2 border-primary bg-transparent hover:bg-nav-hover"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
          
          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <span className="text-sm">More</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">2</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Timeline</DropdownMenuItem>
              <DropdownMenuItem>Forms</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  );
}
