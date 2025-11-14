// src/pages/BacklogPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CreateSprintDialog } from "@/components/CreateSprintDialog";
import { CreateWorkItemDialog } from "@/components/CreateWorkItemDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import dropdown components if not already

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
  sprints: Sprint[]; // Include sprints array
}

interface Sprint {
  id: string;
  name: string;
  status: string; // e.g., 'PLANNED', 'ACTIVE', 'COMPLETED'
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

  const fetchData = async () => {
    if (!spaceKey) return;

    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);

      const [spaceData, workItemsData]: any = await Promise.all([
        client.request(GET_SPACE_DATA, { spaceKey }),
        client.request(GET_WORK_ITEMS, { spaceKey }),
      ]);

      // CORRECTED: Handle backend returning an array for space
      setSpace(spaceData.space?.[0] || null); // Get the first (and likely only) space object from the array
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

  // Separate backlog items (not assigned to any sprint) and group sprint items
  const backlogItems = workItems.filter(item => !item.sprintId);
  const allSprints = space?.sprints || [];

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Backlog</h1>
          <div className="flex gap-2">
            <CreateSprintDialog spaceId={space.id} onSuccess={fetchData} />
            <CreateWorkItemDialog spaceId={space.id} onSuccess={fetchData} />
          </div>
        </div>

        {/* Render all sprints */}
        {allSprints.map((sprint) => {
          // Filter work items belonging to this specific sprint
          const sprintItems = workItems.filter(item => item.sprintId === sprint.id);

          return (
            <Card key={sprint.id} className="mb-4"> {/* Added mb-4 for spacing between cards */}
              <CardHeader>
                <div className="flex items-start justify-between"> {/* Changed from center to start for vertical alignment */}
                  <div className="flex items-start gap-3"> {/* Changed from center to start for vertical alignment */}
                    <ChevronRight className="h-5 w-5 mt-1" /> {/* Added mt-1 for vertical alignment */}
                    <div>
                      <CardTitle className="text-xl">{sprint.name}</CardTitle> {/* Increased text size */}
                      <CardDescription className="mt-1"> {/* Added mt-1 for spacing */}
                        Status: <span className="font-medium">{sprint.status}</span> {/* Made status bold */}
                        {sprint.startDate && sprint.endDate && (
                          <>
                            {" "}({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})
                          </>
                        )}
                        {sprint.goal && (
                          <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p> 
                                                )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Example Dropdown for Sprint Actions (Move, Edit, Delete) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Sprint Actions</span>
                          <ChevronRight className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log("Edit Sprint", sprint.id)}>Edit Sprint</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Delete Sprint", sprint.id)}>Delete Sprint</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant={sprint.status === 'ACTIVE' ? 'default' : sprint.status === 'PLANNED' ? 'secondary' : 'outline'}>
                      {sprint.status}
                    </Badge>
                  </div>
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
          );
        })}

        {/* Backlog Section (Items not in any sprint) */}
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