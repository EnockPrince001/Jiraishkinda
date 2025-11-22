import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditWorkItemDialog } from "@/components/EditWorkItemDialog";

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
  sprints: Sprint[];
}

interface Sprint {
  id: string;
  name: string;
  status: string;
}

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  sprintId?: string;
  assignee?: { id: string; userName: string };
}

export default function BoardPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null); // New state
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

  // --- 1. FIND ACTIVE SPRINT ---
  const activeSprint = space.sprints?.find(s => s.status === 'ACTIVE');

  // --- 2. FILTER ITEMS ---
  let boardItems = workItems;

  if (space.type === 'SCRUM') {
    if (!activeSprint) {
      boardItems = [];
    } else {
      // Filter: Show items belonging to this sprint (Case Insensitive Match)
      boardItems = workItems.filter(item =>
        item.sprintId && activeSprint.id &&
        item.sprintId.toLowerCase() === activeSprint.id.toLowerCase()
      );
    }
  }

  // --- 3. DEFINE COLUMNS (FIXED: Using Underscores to match Backend) ---
  const columns = [
    { id: 'TO_DO', title: 'To Do' },          // <--- FIXED
    { id: 'IN_PROGRESS', title: 'In Progress' }, // <--- FIXED
    { id: 'DONE', title: 'Done' },
  ];

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 h-full flex flex-col">
        {/* Show Active Sprint Banner for Scrum */}
        {space.type === 'SCRUM' && (
          <div className="mb-4">
            {activeSprint ? (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{activeSprint.name}</h2>
                <Badge>Active Sprint</Badge>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/20 text-center">
                <p className="text-muted-foreground">No active sprint. Go to Backlog to start a sprint.</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 h-full">
          {columns.map((column) => {
            // Filter items for this specific column
            const columnItems = boardItems.filter(item => item.status === column.id);

            return (
              <div key={column.id} className="flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnItems.length}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] bg-muted/10 rounded-lg p-2">
                  {columnItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-all" // Changed cursor-grab to cursor-pointer
                      onClick={() => setSelectedWorkItemId(item.id)} // Added onClick
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-medium line-clamp-2">{item.summary}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">{item.key}</span>
                          <div className="flex items-center gap-2">
                            {item.assignee && (
                              <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {item.assignee.userName.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate max-w-[80px]">{item.assignee.userName}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                              {item.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditWorkItemDialog
        workItemId={selectedWorkItemId}
        open={!!selectedWorkItemId}
        onOpenChange={(open) => !open && setSelectedWorkItemId(null)}
        onSuccess={fetchData}
      />
    </MainLayout>
  );
}