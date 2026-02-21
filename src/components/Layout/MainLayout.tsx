import { useState, useRef, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { TopNavBar } from "./TopNavBar";
import { WorkAreaNav } from "./WorkAreaNav";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";

interface MainLayoutProps {
  children: React.ReactNode;
  spaceName?: string;
  spaceType?: "SCRUM" | "KANBAN";
  spaceId?: string; // OPTIONAL but enables per-workspace width
}

export function MainLayout({
  children,
  spaceName,
  spaceType,
  spaceId,
}: MainLayoutProps) {
  const storageKey = spaceId
    ? `sidebar-size-${spaceId}`
    : "sidebar-size-default";

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const sidebarRef = useRef<ImperativePanelHandle>(null);

  // Restore sidebar size (workspace-specific)
  const defaultSize = (() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Number(saved) : 15;
  })();

  const collapseSidebar = () => {
    sidebarRef.current?.collapse();
    setIsCollapsed(true);
    localStorage.setItem("sidebar-collapsed", "true");
  };

  const expandSidebar = () => {
    sidebarRef.current?.expand();
    setIsCollapsed(false);
    localStorage.setItem("sidebar-collapsed", "false");
  };

  const toggleSidebar = () => {
    isCollapsed ? expandSidebar() : collapseSidebar();
  };

  /* -------------------------------
     Keyboard shortcut (Ctrl/Cmd + B)
  -------------------------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isCollapsed]);

  /* -------------------------------
     Auto-collapse on small screens
  -------------------------------- */
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");

    const handleResize = () => {
      if (media.matches) {
        collapseSidebar();
      } else {
        expandSidebar();
      }
    };

    handleResize();
    media.addEventListener("change", handleResize);

    return () => media.removeEventListener("change", handleResize);
  }, []);

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <div className="flex min-h-screen w-full">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-screen"
          onLayout={(sizes) => {
            if (sizes[0] > 0) {
              localStorage.setItem(storageKey, sizes[0].toString());
            }
          }}
        >
          <ResizablePanel
            ref={sidebarRef}
            defaultSize={isCollapsed ? 0 : defaultSize}
            minSize={isCollapsed ? 0 : 10}
            maxSize={25}
            collapsible
            collapsedSize={0}
            onCollapse={collapseSidebar}
            onExpand={expandSidebar}
            className={isCollapsed ? "" : "min-w-[180px] max-w-[350px]"}
          >
            {!isCollapsed && <AppSidebar />}
          </ResizablePanel>

          {!isCollapsed && (
            <ResizableHandle
              withHandle
              className="hover:bg-primary/20 transition-colors"
            />
          )}

          <ResizablePanel defaultSize={isCollapsed ? 100 : 85} minSize={60}>
            <div className="flex flex-1 flex-col h-full">
              <TopNavBar
                spaceId={spaceId!}
                sidebarCollapsed={isCollapsed}
                onToggleSidebar={toggleSidebar}
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
