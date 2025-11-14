import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CreateWorkItemDialog } from "@/components/CreateWorkItemDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
}

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee?: { id: string; userName: string };
}

export default function BoardPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!spaceKey) return;
    
    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);
      
      const [spaceData, workItemsData]: any = await Promise.all([
        client.request(GET_SPACE_DATA, { spaceKey }),
        client.request(GET_WORK_ITEMS, { spaceKey }),
      ]);

      setSpace(spaceData.space?.[0] || null);
      setWorkItems(workItemsData.workItemsForSpace || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [spaceKey, token]);

  if (loading) {
    return (
      <MainLayout spaceName={space?.name} spaceType={space?.type}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!space) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Space not found</div>
        </div>
      </MainLayout>
    );
  }

  const columns = [
    { id: 'TO DO', title: 'To Do' },
    { id: 'IN PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
  ];

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="text-sm text-muted-foreground">
                    {workItems.filter((item) => item.status === column.id).length}
                  </span>
                </div>
                <CreateWorkItemDialog 
                  spaceId={space.id} 
                  onSuccess={fetchData}
                  defaultStatus={column.id}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
              <div className="space-y-2 min-h-[200px]">
                {workItems
                  .filter((item) => item.status === column.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-card border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-sm mb-1">{item.key}</div>
                      <div className="text-sm mb-2">{item.summary}</div>
                      {item.assignee && (
                        <div className="text-xs text-muted-foreground">
                          {item.assignee.userName}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
