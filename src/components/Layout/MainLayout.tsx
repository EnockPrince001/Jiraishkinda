import { useState, useEffect, useRef } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { TopNavBar } from "./TopNavBar";
import { WorkAreaNav } from "./WorkAreaNav";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import type { ImperativePanelHandle } from "react-resizable-panels";

interface MainLayoutProps {
  children: React.ReactNode;
  spaceName?: string;
  spaceType?: 'SCRUM' | 'KANBAN';
}

export function MainLayout({ children, spaceName, spaceType }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });
  const sidebarRef = useRef<ImperativePanelHandle>(null);

  // Restore sidebar size from localStorage
  const defaultSize = (() => {
    const saved = localStorage.getItem("sidebar-size");
    return saved ? parseFloat(saved) : 15;
  })();

  const handleCollapse = () => {
    const panel = sidebarRef.current;
    if (panel) {
      if (isCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const handlePanelCollapse = () => {
    setIsCollapsed(true);
    localStorage.setItem("sidebar-collapsed", "true");
  };

  const handlePanelExpand = () => {
    setIsCollapsed(false);
    localStorage.setItem("sidebar-collapsed", "false");
  };

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <div className="flex min-h-screen w-full">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-screen"
          onLayout={(sizes) => {
            if (sizes[0] > 0) {
              localStorage.setItem("sidebar-size", JSON.stringify(sizes[0]));
            }
          }}
        >
          <ResizablePanel
            ref={sidebarRef}
            defaultSize={isCollapsed ? 0 : defaultSize}
            minSize={10}
            maxSize={25}
            collapsible={true}
            collapsedSize={0}
            onCollapse={handlePanelCollapse}
            onExpand={handlePanelExpand}
            className={isCollapsed ? "" : "min-w-[180px] max-w-[350px]"}
          >
            {!isCollapsed && <AppSidebar />}
          </ResizablePanel>
          <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />
          <ResizablePanel defaultSize={isCollapsed ? 100 : 85} minSize={60}>
            <div className="flex-1 flex flex-col h-full">
              <TopNavBar
                sidebarCollapsed={isCollapsed}
                onToggleSidebar={handleCollapse}
              />
              <WorkAreaNav spaceName={spaceName} spaceType={spaceType} />
              <main className="flex-1 overflow-auto bg-background">
                {children}
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}
