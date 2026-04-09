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
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignee: [] as string[],
    sprint: [] as string[],
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const exists = prev[type].includes(value);
  
      return {
        ...prev,
        [type]: exists
          ? prev[type].filter((v) => v !== value)
          : [...prev[type], value],
      };
    });
  };
  const totalFilters =
  filters.status.length +
  filters.priority.length +
  filters.assignee.length +
  filters.sprint.length;

const filterCounts: Record<string, number> = {
  Status: filters.status.length,
  Priority: filters.priority.length,
  Assignee: filters.assignee.length,
  Sprint: filters.sprint.length,
  Parent: 0,
  "Work type": 0,
  Labels: 0,
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

  let backlogItems = workItems.filter(item => !item.sprintId);

  // 🔍 SEARCH FILTER
  if (searchQuery.trim() !== "") {
    backlogItems = backlogItems.filter(item =>
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.priority?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignee?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // ✅ FILTERS
  
  if (filters.status.length > 0) {
    backlogItems = backlogItems.filter(item =>
      filters.status.includes(item.boardColumnId)
    );
  }
  
  if (filters.priority.length > 0) {
    backlogItems = backlogItems.filter(item =>
      item.priority && filters.priority.includes(item.priority.toUpperCase())
    );
  }
  
  if (filters.assignee.length > 0) {
    backlogItems = backlogItems.filter(item => {
      if (!item.assignee) {
        return filters.assignee.includes("unassigned");
      }
      return filters.assignee.includes(item.assignee.id);
    });
  }
  
  if (filters.sprint.length > 0) {
    backlogItems = backlogItems.filter(item =>
      item.sprintId && filters.sprint.includes(item.sprintId)
    );
  }

  const allSprints = space?.sprints.filter(s => s.status !== 'COMPLETED') || [];
  // ?? instead of || so that null from GraphQL is safely coerced to []
  const boardColumns = space.boardColumns ?? [];

  return (
    <MainLayout spaceName={space.name} spaceType={space.type} spaceId={space.id}>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
  
  {/* LEFT SIDE */}
  <div className="flex items-center gap-4">
    <h1 className="text-2xl font-bold">Backlog</h1>

    {/* 🔍 SEARCH */}
    <div className="relative">
      <input
        placeholder="Search backlog"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-[220px] pl-8 pr-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
        🔍
      </span>
    </div>

    {/* FILTER BUTTON */}
    <div className="relative">
    <Button
  onClick={() => setIsFilterOpen(prev => !prev)}
  className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-500 hover:bg-blue-100 transition-colors"
>
  <span className="text-lg">≡</span>
  Filter  
        {totalFilters > 0 && (
          <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
            {totalFilters}
          </span>
        )}
      </Button>

      {isFilterOpen && (
  <div className="absolute mt-2 w-[500px] bg-white border rounded shadow-lg z-50">
    
    {/* TOP BAR WITH CLOSE BUTTON */}
    <div className="flex justify-end p-2 border-b">
      <button
        onClick={() => setIsFilterOpen(false)}
        className="text-gray-500 hover:text-black text-sm"
      >
        ✕
      </button>
    </div>

    {/* MAIN CONTENT */}
    <div className="flex">
          
          {/* LEFT PANEL */}
          <div className="w-1/3 border-r">
            {["Parent","Sprint","Assignee","Work type","Labels","Status","Priority"].map(item => {
              const count = filterCounts[item] || 0;

              return (
                <div
                  key={item}
                  onClick={() => setActiveFilter(item)}
                  className={`flex justify-between px-3 py-2 cursor-pointer ${
                    count > 0
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>{item}</span>
                  {count > 0 && <span className="text-xs">{count}</span>}
                </div>
              );
            })}
          </div>

          {/* RIGHT PANEL */}
          <div className="w-2/3 p-3">
            {!activeFilter && (
              <div className="text-sm text-muted-foreground">
                Select a field to start creating a filter.
              </div>
            )}

            {activeFilter === "Assignee" && (
              <div className="space-y-2">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleFilter("assignee", "unassigned")}
                >
                  <input
                    type="checkbox"
                    checked={filters.assignee.includes("unassigned")}
                    readOnly
                  />
                  <span>Unassigned</span>
                </div>

                {(space?.members || []).map((m) => (
                  <div
                    key={m.user.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleFilter("assignee", m.user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={filters.assignee.includes(m.user.id)}
                      readOnly
                    />
                    <span>{m.user.userName}</span>
                  </div>
                ))}
              </div>
            )}

            {activeFilter === "Status" && (
              <div className="space-y-2">
                {boardColumns.map((col) => (
  <div
    key={col.id}
    className="flex items-center gap-2 cursor-pointer"
    onClick={() => toggleFilter("status", col.id)}
  >
    <input
      type="checkbox"
      checked={filters.status.includes(col.id)}
      readOnly
    />
    <span>{col.name}</span>
  </div>
))}                                                                                             
              </div>
            )}

            {activeFilter === "Priority" && (
              <div className="space-y-2">
                {["LOW", "MEDIUM", "HIGH"].map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleFilter("priority", p)}
                  >
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(p)}
                      readOnly
                    />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}

            {activeFilter === "Sprint" && (
              <div className="space-y-2">
                {allSprints.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleFilter("sprint", s.id)}
                  >
                    <input
                      type="checkbox"
                      checked={filters.sprint.includes(s.id)}
                      readOnly
                    />
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* FOOTER */}
            {activeFilter && (
              <div className="flex justify-between border-t pt-2 mt-3">
                <button
                  className="text-sm text-blue-600"
                  onClick={() => {
                    switch (activeFilter) {
                      case "Status":
                        setFilters(prev => ({ ...prev, status: [] }));
                        break;
                      case "Priority":
                        setFilters(prev => ({ ...prev, priority: [] }));
                        break;
                      case "Assignee":
                        setFilters(prev => ({ ...prev, assignee: [] }));
                        break;
                      case "Sprint":
                        setFilters(prev => ({ ...prev, sprint: [] }));
                        break;
                    }
                  }}
                >
                  Clear all
                </button>

                <span className="text-xs text-muted-foreground">
  {activeFilter === "Status" &&
    `${filters.status.length} out of ${boardColumns.length} selected`}

  {activeFilter === "Priority" &&
    `${filters.priority.length} out of 3 selected`}

  {activeFilter === "Assignee" &&
    `${filters.assignee.length} out of ${(space?.members?.length || 0) + 1} selected`}

  {activeFilter === "Sprint" &&
    `${filters.sprint.length} out of ${allSprints.length} selected`}
</span>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>

    {/* ✅ GLOBAL CLEAR FILTERS */}
    {totalFilters > 0 && (
      <button
        onClick={() =>
          setFilters({
            status: [],
            priority: [],
            assignee: [],
            sprint: [],
          })
        }
        className="text-sm text-red-600 hover:underline"
      >
        Clear filters
      </button>
    )}
  </div>

  {/* RIGHT SIDE */}
  <div className="flex gap-2">
    <CreateSprintDialog spaceId={space.id} onSuccess={fetchData} />
    <CreateWorkItemDialog spaceId={space.id} onSuccess={fetchData} />
  </div>

</div>
        {allSprints.map((sprint) => {
          let sprintItems = workItems.filter(item => item.sprintId === sprint.id);

          // 🔍 SEARCH
          if (searchQuery.trim() !== "") {
            sprintItems = sprintItems.filter(item =>
              item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.priority?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.assignee?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          // ✅ APPLY SAME FILTERS
          if (filters.status.length > 0) {
            sprintItems = sprintItems.filter(item =>
              filters.status.includes(item.boardColumnId)
            );
          }
          
          if (filters.priority.length > 0) {
            sprintItems = sprintItems.filter(item =>
              item.priority && filters.priority.includes(item.priority.toUpperCase())
            );
          }
          
          if (filters.assignee.length > 0) {
            sprintItems = sprintItems.filter(item => {
              if (!item.assignee) {
                return filters.assignee.includes("unassigned");
              }
              return filters.assignee.includes(item.assignee.id);
            });
          }
          
          if (filters.sprint.length > 0) {
            sprintItems = sprintItems.filter(item =>
              item.sprintId && filters.sprint.includes(item.sprintId)
            );
          }

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