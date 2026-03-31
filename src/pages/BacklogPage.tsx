import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CreateSprintDialog } from "@/components/CreateSprintDialog";
import { CreateWorkItemDialog } from "@/components/CreateWorkItemDialog";
import { EditSprintDialog } from "@/components/EditSprintDialog";
import { EditWorkItemDialog } from "@/components/EditWorkItemDialog";
import { WorkItemOptionsMenu } from "@/components/WorkItemOptionsMenu";
import { AssigneeSelect } from "@/components/AssigneeSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle2, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS, START_SPRINT, COMPLETE_SPRINT, DELETE_SPRINT, UPDATE_WORK_ITEM_DETAILS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BoardColumn } from "@/types";

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
  sprints: Sprint[];
  members: Member[];
  // null because GraphQL returns null (not undefined) for missing relations
  boardColumns: BoardColumn[] | null;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

interface Member {
  role: 'ADMINISTRATOR' | 'MEMBER' | 'VIEWER';
  user: {
    id: string;
    userName: string;
  };
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
  flagged: boolean;
  boardColumnId: string;
}

export default function BacklogPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState("");
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

  const saveSummary = async (item: WorkItem) => {
    if (editingSummary.trim() === item.summary) {
      setEditingItemId(null);
      return;
    }
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM_DETAILS, {
        itemId: item.id,
        input: { summary: editingSummary.trim() },
      });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setEditingItemId(null);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(START_SPRINT, { sprintId });
      toast({ title: "Success", description: "Sprint started successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start sprint", variant: "destructive" });
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(COMPLETE_SPRINT, { sprintId });
      toast({ title: "Success", description: "Sprint completed successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete sprint", variant: "destructive" });
    }
  };

  const handleDeleteSprint = async () => {
    if (!deletingSprintId) return;
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(DELETE_SPRINT, { sprintId: deletingSprintId });
      toast({ title: "Success", description: "Sprint deleted successfully" });
      setDeletingSprintId(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete sprint", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();
  }, [spaceKey, token]);

  if (loading) {
    return (
      <MainLayout spaceName={space?.name} spaceType={space?.type} spaceId={space?.id}>
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

  const backlogItems = workItems.filter(item => !item.sprintId);
  const allSprints = space?.sprints.filter(s => s.status !== 'COMPLETED') || [];
  // ?? instead of || so that null from GraphQL is safely coerced to []
  const boardColumns = space.boardColumns ?? [];

  return (
    <MainLayout spaceName={space.name} spaceType={space.type} spaceId={space.id}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Backlog</h1>
          <div className="flex gap-2">
            <CreateSprintDialog spaceId={space.id} onSuccess={fetchData} />
            <CreateWorkItemDialog spaceId={space.id} onSuccess={fetchData} />
          </div>
        </div>

        {allSprints.map((sprint) => {
          const sprintItems = workItems.filter(item => item.sprintId === sprint.id);

          return (
            <Card key={sprint.id} className="mb-4">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ChevronRight className="h-5 w-5 mt-1" />
                    <div>
                      <CardTitle className="text-xl">{sprint.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Status: <span className="font-medium">{sprint.status}</span>
                        {sprint.startDate && sprint.endDate && (
                          <> ({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})</>
                        )}
                        {sprint.goal && (
                          <span className="text-sm text-muted-foreground mt-1 block">{sprint.goal}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sprint.status === 'PLANNED' && (
                      <Button size="sm" variant="default" onClick={() => handleStartSprint(sprint.id)}>
                        <Play className="h-4 w-4 mr-1" /> Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'ACTIVE' && (
                      <Button size="sm" variant="default" onClick={() => handleCompleteSprint(sprint.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Sprint
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditingSprint(sprint)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingSprintId(sprint.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Badge variant={sprint.status === 'ACTIVE' ? 'default' : 'secondary'}>
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
                        onClick={() => setSelectedWorkItemId(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium text-muted-foreground">{item.key}</span>
                            {editingItemId === item.id ? (
                              <input
                                value={editingSummary}
                                autoFocus
                                onChange={(e) => setEditingSummary(e.target.value)}
                                onBlur={() => setEditingItemId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); saveSummary(item); }
                                  if (e.key === "Escape") setEditingItemId(null);
                                }}
                                className="text-sm border rounded px-1 bg-yellow-50 focus:outline-none w-full"
                              />
                            ) : (
                              <span
                                className="text-sm cursor-text hover:bg-muted px-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItemId(item.id);
                                  setEditingSummary(item.summary);
                                }}
                              >
                                {item.flagged && <span className="text-red-500 mr-1">🚩</span>}
                                {item.summary}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Badge variant="outline">{item.priority}</Badge>
                            {item.storyPoints && <Badge variant="secondary">{item.storyPoints} SP</Badge>}
                            <AssigneeSelect
                              itemId={item.id}
                              currentAssigneeId={item.assignee?.id}
                              members={space?.members || []}
                              onSuccess={fetchData}
                            />
                            <WorkItemOptionsMenu
                              item={item}
                              sprints={allSprints}
                              allItems={sprintItems}
                              boardColumns={boardColumns}
                              onSuccess={fetchData}
                            />
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

        {/* Backlog Section */}
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
                    onClick={() => setSelectedWorkItemId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium text-muted-foreground">{item.key}</span>
                        {editingItemId === item.id ? (
                          <input
                            value={editingSummary}
                            autoFocus
                            onChange={(e) => setEditingSummary(e.target.value)}
                            onBlur={() => setEditingItemId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); saveSummary(item); }
                              if (e.key === "Escape") setEditingItemId(null);
                            }}
                            className="text-sm border rounded px-1 bg-yellow-50 focus:outline-none w-full"
                          />
                        ) : (
                          <span
                            className="text-sm cursor-text hover:bg-muted px-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItemId(item.id);
                              setEditingSummary(item.summary);
                            }}
                          >
                            {item.flagged && <span className="text-red-500 mr-1">🚩</span>}
                            {item.summary}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="outline">{item.priority}</Badge>
                        {item.storyPoints && <Badge variant="secondary">{item.storyPoints} SP</Badge>}
                        <AssigneeSelect
                          itemId={item.id}
                          currentAssigneeId={item.assignee?.id}
                          members={space?.members || []}
                          onSuccess={fetchData}
                        />
                        <WorkItemOptionsMenu
                          item={item}
                          sprints={allSprints}
                          allItems={backlogItems}
                          boardColumns={boardColumns}
                          onSuccess={fetchData}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {editingSprint && (
        <EditSprintDialog
          sprint={editingSprint}
          open={!!editingSprint}
          onOpenChange={(open) => !open && setEditingSprint(null)}
          onSuccess={fetchData}
        />
      )}

      <AlertDialog open={!!deletingSprintId} onOpenChange={(open) => !open && setDeletingSprintId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sprint? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSprint} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditWorkItemDialog
        workItemId={selectedWorkItemId}
        open={!!selectedWorkItemId}
        onOpenChange={(open) => !open && setSelectedWorkItemId(null)}
        onSuccess={fetchData}
        boardColumns={space.boardColumns ?? []}
        members={space.members || []}
      />
    </MainLayout>
  );
}