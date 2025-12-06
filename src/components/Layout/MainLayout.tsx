import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { TopNavBar } from "./TopNavBar";
import { WorkAreaNav } from "./WorkAreaNav";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface MainLayoutProps {
  children: React.ReactNode;
  spaceName?: string;
  spaceType?: 'SCRUM' | 'KANBAN';
}

export function MainLayout({ children, spaceName, spaceType }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-screen"
          onLayout={(sizes) => {
            // Persist sidebar size to localStorage
            localStorage.setItem("sidebar-size", JSON.stringify(sizes[0]));
          }}
        >
          <ResizablePanel
            defaultSize={15}
            minSize={10}
            maxSize={25}
            className="min-w-[180px] max-w-[350px]"
          >
            <AppSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />
          <ResizablePanel defaultSize={85} minSize={60}>
            <div className="flex-1 flex flex-col h-full">
              <TopNavBar />
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

