import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { TopNavBar } from "./TopNavBar";
import { WorkAreaNav } from "./WorkAreaNav";

interface MainLayoutProps {
  children: React.ReactNode;
  spaceName?: string;
}

export function MainLayout({ children, spaceName }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNavBar />
          <WorkAreaNav spaceName={spaceName} />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
