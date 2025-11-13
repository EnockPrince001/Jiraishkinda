import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  startDate?: string;
  endDate?: string;
  goal?: string;
}

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  storyPoints?: number;
  sprintId?: string;
  assignee?: { id: string; userName: string };
}

export default function BacklogPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!spaceKey) return;
      
      try {
        const client = getGraphQLClient(token || undefined);
        
        const [spaceData, workItemsData]: any = await Promise.all([
          client.request(GET_SPACE_DATA, { spaceKey }),
          client.request(GET_WORK_ITEMS, { spaceKey }),
        ]);

        setSpace(spaceData.space);
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

    fetchData();
  }, [spaceKey, token, toast]);

  const backlogItems = workItems.filter(item => !item.sprintId);
  const activeSprint = space?.sprints?.find(s => s.status === 'ACTIVE');
  const sprintItems = activeSprint 
    ? workItems.filter(item => item.sprintId === activeSprint.id)
    : [];

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

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Backlog</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Sprint
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Issue
            </Button>
          </div>
        </div>

        {/* Active Sprint */}
        {activeSprint && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronRight className="h-5 w-5" />
                  <div>
                    <CardTitle>{activeSprint.name}</CardTitle>
                    <CardDescription>
                      {activeSprint.startDate && activeSprint.endDate && (
                        <>
                          {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge>Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sprintItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items in this sprint</p>
                ) : (
                  sprintItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{item.key}</span>
                          <span className="text-sm">{item.summary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.priority}</Badge>
                          {item.storyPoints && (
                            <Badge variant="secondary">{item.storyPoints} SP</Badge>
                          )}
                          {item.assignee && (
                            <span className="text-xs text-muted-foreground">
                              {item.assignee.userName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backlog */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronRight className="h-5 w-5" />
                <CardTitle>Backlog</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">
                {backlogItems.length} {backlogItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backlogItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items in backlog</p>
              ) : (
                backlogItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{item.key}</span>
                        <span className="text-sm">{item.summary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.priority}</Badge>
                        {item.storyPoints && (
                          <Badge variant="secondary">{item.storyPoints} SP</Badge>
                        )}
                        {item.assignee && (
                          <span className="text-xs text-muted-foreground">
                            {item.assignee.userName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
