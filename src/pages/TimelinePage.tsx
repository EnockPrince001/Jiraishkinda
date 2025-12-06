import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Target, Users } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

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
  priority: string;
  sprintId?: string;
  assignee?: { id: string; userName: string };
  updatedDate: string;
}

export default function TimelinePage() {
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

    fetchData();
  }, [spaceKey, token, toast]);

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

  // Get completed sprints
  const completedSprints = space.sprints
    ?.filter(s => s.status === 'COMPLETED')
    .sort((a, b) => {
      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
      return dateB - dateA; // Most recent first
    }) || [];

  // Get items for each sprint
  const getSprintItems = (sprintId: string) => {
    return workItems.filter(item => item.sprintId === sprintId);
  };

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-muted-foreground">Completed sprints and their work items</p>
        </div>

        <div className="space-y-6">
          {completedSprints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No completed sprints yet</p>
                <p className="text-muted-foreground">Complete a sprint to see it here</p>
              </CardContent>
            </Card>
          ) : (
            completedSprints.map((sprint) => {
              const sprintItems = getSprintItems(sprint.id);

              return (
                <Card key={sprint.id} className="overflow-hidden">
                  <CardHeader className="bg-green-50 dark:bg-green-950/20 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-xl">{sprint.name}</CardTitle>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Completed
                          </Badge>
                        </div>
                        {sprint.goal && (
                          <CardDescription className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {sprint.goal}
                          </CardDescription>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        {sprint.startDate && sprint.endDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Users className="h-3 w-3" />
                          {sprintItems.length} {sprintItems.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {sprintItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items in this sprint</p>
                    ) : (
                      <div className="space-y-2">
                        {sprintItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">{item.key}</span>
                                  <span className="text-sm">{item.summary}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{item.priority}</Badge>
                              {item.assignee && (
                                <span className="text-xs text-muted-foreground">{item.assignee.userName}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}

