import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS, ADD_BOARD_COLUMN, COMPLETE_SPRINT } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditWorkItemDialog } from "@/components/EditWorkItemDialog";
import { Space, WorkItem } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";


export default function BoardPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
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

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 h-full flex flex-col">
        {/* Show Active Sprint Banner for Scrum */}
        {space.type === 'SCRUM' && (
          <div className="mb-4 flex items-center justify-between">
            {activeSprint ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{activeSprint.name}</h2>
                  <Badge>Active Sprint</Badge>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (confirm("Are you sure you want to complete this sprint?")) {
                      try {
                        const client = getGraphQLClient(token || undefined);
                        await client.request(COMPLETE_SPRINT, { sprintId: activeSprint.id });
                        toast({ title: "Success", description: "Sprint completed" });
                        fetchData();
                      } catch (e) {
                        toast({ title: "Error", description: "Failed to complete sprint", variant: "destructive" });
                      }
                    }
                  }}
                >
                  Complete Sprint
                </Button>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/20 text-center w-full">
                <p className="text-muted-foreground">No active sprint. Go to Backlog to start a sprint.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {/* Dynamic Columns */}
          {space.boardColumns?.sort((a, b) => a.order - b.order).map((column) => {
            // Filter items for this specific column
            const columnItems = boardItems.filter(item => item.boardColumnId === column.id);

            return (
              <div key={column.id} className="flex flex-col gap-4 w-[280px] min-w-[240px] flex-shrink-0 min-h-0">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide">{column.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnItems.length}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] bg-muted/10 rounded-lg p-2">
                  {columnItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setSelectedWorkItemId(item.id)}
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

          {/* Add Column Button */}
          <div className="w-[280px] min-w-[240px] flex-shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-[50px] border-dashed">
                  <Plus className="mr-2 h-4 w-4" /> Add Column
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Column</DialogTitle>
                </DialogHeader>
                <AddColumnForm spaceId={space.id} onSuccess={fetchData} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <EditWorkItemDialog
        workItemId={selectedWorkItemId}
        open={!!selectedWorkItemId}
        onOpenChange={(open) => !open && setSelectedWorkItemId(null)}
        onSuccess={fetchData}
        boardColumns={space.boardColumns || []}
        members={space.members || []}
      />
    </MainLayout>
  );
}

function AddColumnForm({ spaceId, onSuccess }: { spaceId: string, onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);
      await client.request(ADD_BOARD_COLUMN, { name, spaceId });
      toast({ title: "Success", description: "Column added" });
      setName("");
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to add column", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Column Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Column"}
        </Button>
      </DialogFooter>
    </form>
  );
}