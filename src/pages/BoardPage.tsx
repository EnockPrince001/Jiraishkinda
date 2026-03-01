import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS, ADD_BOARD_COLUMN, TOGGLE_WORK_ITEM_FLAG, UPDATE_WORK_ITEM, MOVE_BOARD_COLUMN_LEFT, MOVE_BOARD_COLUMN_RIGHT, DELETE_BOARD_COLUMN, MOVE_WORK_ITEM_TO_TOP, MOVE_WORK_ITEM_UP, COMPLETE_SPRINT, UPDATE_WORK_ITEM_DETAILS, DELETE_WORK_ITEM } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { useDraggable, } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { StoryPoints } from "@/components/StoryPoints";
import { Card, CardContent } from "@/components/ui/card";
import { EditWorkItemDialog } from "@/components/EditWorkItemDialog";
import { Space, WorkItem } from "@/types";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// Move these OUTSIDE the main component to prevent redundant re-mounts which cause typing issues (cursor jumping)
const DroppableColumn = ({ columnId, children }: { columnId: string, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
  flex flex-col space-y-3 flex-1 min-h-[400px] h-full rounded-lg p-2
  ${isOver ? "bg-primary/10" : "bg-muted/10"}
`}
    >
      {children}
    </div>
  );
};

const DraggableItem = ({ item, children }: { item: any, children: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {typeof children === "function"
        ? children({ listeners })
        : children}
    </div>
  );
};
export default function BoardPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState("");
  const [deletingItem, setDeletingItem] = useState<WorkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
  const [confirmDeleteColumnId, setConfirmDeleteColumnId] = useState<string | null>(null);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  const [newTaskSummary, setNewTaskSummary] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(DELETE_WORK_ITEM, {
        itemId: deletingItem.id,
      });

      toast({
        title: "Task deleted",
        description: "The task was removed successfully",
      });

      setDeletingItem(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const itemId = active.id;
    const newColumnId = over.id;

    const item = workItems.find(i => i.id === itemId);
    if (!item || item.boardColumnId === newColumnId) return;

    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(UPDATE_WORK_ITEM, {
        itemId,
        boardColumnId: newColumnId,
      });

      // ✅ Re-fetch from backend to get CORRECT order
      await fetchData();

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    }
  };


  const moveColumnLeft = async (column) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(MOVE_BOARD_COLUMN_LEFT, {
        columnId: column.id,
      });

      fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move column left",
        variant: "destructive",
      });
    }
  };

  const moveColumnRight = async (column) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(MOVE_BOARD_COLUMN_RIGHT, {
        columnId: column.id,
      });

      fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move column right",
        variant: "destructive",
      });
    }
  };

  const deleteColumn = async (column, targetColumnId) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(DELETE_BOARD_COLUMN, {
        columnId: column.id,
        targetColumnId,
      });

      toast({
        title: "Column deleted",
        description: "Column removed successfully",
      });

      fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive",
      });
    }
  };
  // =======================
  // JIRA-LIKE MENU ACTIONS
  // =======================

  const moveItemUp = async (item) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(MOVE_WORK_ITEM_UP, {
        workItemId: item.id,
      });

      fetchData(); // ✅ reload from server
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move item up",
        variant: "destructive",
      });
    }
  };

  const moveItemToTop = async (item) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(MOVE_WORK_ITEM_TO_TOP, {
        workItemId: item.id,
      });

      fetchData(); // ✅ reload from server
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move item to top",
        variant: "destructive",
      });
    }
  };

  const changeStatus = async (item, columnId) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(UPDATE_WORK_ITEM, {
        itemId: item.id,
        boardColumnId: columnId,
      });

      fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    }
  };

  const toggleFlag = async (item) => {
    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(TOGGLE_WORK_ITEM_FLAG, {
        itemId: item.id,
        flagged: !item.flagged, // 🔁 toggle
      });

      fetchData(); // refresh board
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to toggle flag",
        variant: "destructive",
      });
    }
  };

  const openLabelDialog = (item) => {
    console.log("Open label dialog for", item.key);

    // later:
    // setSelectedItemForLabels(item)
    // setLabelDialogOpen(true)
  };

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
  const deleteWorkItem = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      const client = getGraphQLClient(token || undefined);

      await client.request(DELETE_WORK_ITEM, {
        itemId: deletingItem.id,
      });

      toast({
        title: "Task deleted",
        description: "The task was removed successfully",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };
  useEffect(() => {
    fetchData();
  }, [spaceKey, token]);

  const handleCreateWorkItem = async (columnId: string) => {
    if (!newTaskSummary.trim()) return;

    try {
      setIsCreating(true);
      const client = getGraphQLClient(token || undefined);

      await client.request(CREATE_WORK_ITEM, {
        input: {
          summary: newTaskSummary.trim(),
          spaceId: space.id,
          boardColumnId: columnId,
          type: "TASK",
          priority: "MEDIUM"
        }
      });

      setNewTaskSummary("");
      setCreatingColumnId(null);
      fetchData();

      toast({
        title: "Task created",
        description: "Your new task has been added to the board",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
        input: {
          summary: editingSummary.trim(),
        },
      });

      fetchData(); // or refetchBoardData if board uses a different fetch
    } catch (error) {
      console.error("Failed to update summary", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setEditingItemId(null);
    }
  };
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
      <div className="p-6 h-full flex flex-col overflow-auto">
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
        {/* ================= BOARD HEADER (JIRA STYLE) ================= */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Board
          </h2>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add column
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) =>
            setActiveItemId(String(event.active.id))
          }
          onDragEnd={(event) => {
            handleDragEnd(event);
            setActiveItemId(null);
          }}
          onDragCancel={() => setActiveItemId(null)}
        >
          <div className="flex gap-4 flex-1 overflow-x-auto overflow-y-scroll pb-4 min-h-0">
            {/* ================= DYNAMIC COLUMNS ================= */}
            {space.boardColumns
              ?.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
              .map((column, columnIndex) => {
                const columnItems = boardItems.filter(
                  (item) => item.boardColumnId === column.id
                );
                const totalColumns = space.boardColumns?.length || 0;
                const isFirst = columnIndex === 0;
                const isLast = columnIndex === totalColumns - 1;

                return (
                  <div
                    key={column.id}
                    onMouseEnter={() => setHoveredColumnId(column.id)}
                    onMouseLeave={() => setHoveredColumnId(null)}
                    id={column.id}
                    className="flex flex-col w-[280px] min-w-[240px] flex-shrink-0 h-full"
                  >
                    <div
                      onMouseEnter={() => setHoveredColumnId(column.id)}
                      onMouseLeave={() => {
                        setHoveredColumnId(null);
                        setOpenColumnMenuId(null);
                      }}
                      className="
          flex items-center justify-between p-3 bg-muted/50
            rounded-lg sticky top-0 z-20 backdrop-blur
               ">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm uppercase tracking-wide">
                          {column.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {columnItems.length}
                        </Badge>
                      </div>
                      {/* 3 DOTS (HOVER ONLY) */}
                      {hoveredColumnId === column.id && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenColumnMenuId(
                                openColumnMenuId === column.id ? null : column.id
                              );
                            }}
                            className="text-muted-foreground hover:text-foreground px-1"
                          >
                            ⋯
                          </button>

                          {openColumnMenuId === column.id && (
                            <div
                              className="absolute right-0 mt-2 w-40 bg-popover border rounded-md shadow-md z-50"
                              onMouseLeave={() => setOpenColumnMenuId(null)}
                            >
                              {!isFirst && (
                                <button
                                  onClick={() => moveColumnLeft(column)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                >
                                  Move Left
                                </button>
                              )}

                              {!isLast && (
                                <button
                                  onClick={() => moveColumnRight(column)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                >
                                  Move Right
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  const targetColumnId =
                                    !isLast
                                      ? space.boardColumns[columnIndex + 1].id
                                      : space.boardColumns[columnIndex - 1].id;

                                  if (
                                    confirm(`Delete column "${column.name}" and move items?`)
                                  ) {
                                    deleteColumn(column, targetColumnId);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                      <DroppableColumn columnId={column.id}>
                        {/* INLINE CREATE INPUT (TOP) */}
                        {creatingColumnId === column.id && columnItems.length === 0 && (
                          <div className="bg-background border rounded-md p-2 space-y-2">
                            <textarea
                              value={newTaskSummary}
                              autoFocus
                              onChange={(e) => {
                                setNewTaskSummary(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCreateWorkItem(column.id);
                                }
                                if (e.key === "Escape") {
                                  setCreatingColumnId(null);
                                  setNewTaskSummary("");
                                }
                              }}
                              placeholder="What needs to be done?"
                              className="w-full resize-none text-sm border rounded px-2 py-1 focus:outline-none"
                            />

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled={isCreating}
                                onClick={() => handleCreateWorkItem(column.id)}
                              >
                                {isCreating ? "..." : "✔"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCreatingColumnId(null);
                                  setNewTaskSummary("");
                                }}
                              >
                                ✖
                              </Button>
                            </div>
                          </div>
                        )}
                        {/* + Create (TOP when empty) */}
                        {hoveredColumnId === column.id && columnItems.length === 0 && (
                          <button
                            onClick={() => setCreatingColumnId(column.id)}
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                          >
                            + Create
                          </button>
                        )}
                        {[...columnItems]
                          .sort((a, b) => a.order - b.order)
                          .map((item) => (
                            <DraggableItem key={item.id} item={item}>
                              {({ listeners }) => (
                                <Card

                                  className="group hover:shadow-md transition-all relative"
                                >
                                  <CardContent className="p-3 space-y-2">
                                    <div
                                      className="flex justify-between items-start gap-2 cursor-pointer"
                                      onClick={() => setSelectedWorkItemId(item.id)}
                                    >

                                      {/* DRAG HANDLE */}
                                      <div
                                        {...listeners}

                                        onClick={(e) => e.stopPropagation()}
                                        className="cursor-grab text-muted-foreground hover:text-foreground select-none pt-1"
                                        title="Drag"
                                      >
                                        ⠿
                                      </div>
                                      {/* LEFT: SUMMARY */}
                                      <div className="flex-1 relative">
                                        {editingItemId === item.id ? (
                                          <textarea
                                            value={editingSummary}
                                            autoFocus
                                            rows={1}
                                            onChange={(e) => {
                                              setEditingSummary(e.target.value);
                                              e.target.style.height = "auto";
                                              e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                saveSummary(item);
                                              }
                                              if (e.key === "Escape") {
                                                setEditingItemId(null);
                                              }
                                            }}
                                            onBlur={() => saveSummary(item)}
                                            className="w-full resize-none text-sm border rounded px-2 py-1 bg-yellow-50 focus:outline-none"
                                          />
                                        ) : (
                                          <div
                                            className="group relative cursor-text pr-6"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingItemId(item.id);
                                              setEditingSummary(item.summary);
                                            }}
                                          >

                                            <p className="text-sm font-medium whitespace-pre-wrap break-words flex items-start gap-1">
                                              {item.flagged && (
                                                <span title="Flagged" className="text-red-500">
                                                  🚩
                                                </span>
                                              )}
                                              <span>{item.summary}</span>
                                            </p>
                                            <Pencil
                                              size={14}
                                              className="absolute right-1 top-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* RIGHT: MENU */}
                                      <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            onPointerDown={(e) => {
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground px-1"
                                          >
                                            ⋯
                                          </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                          align="end"
                                          sideOffset={4}
                                          className="w-56 z-[9999]"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setSelectedWorkItemId(item.id)
                                            }
                                          >
                                            Open
                                          </DropdownMenuItem>

                                          <DropdownMenuSeparator />

                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                              Move work item
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="w-44">
                                              <DropdownMenuItem
                                                onClick={() => moveItemToTop(item)}
                                              >
                                                To the top
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => moveItemUp(item)}
                                              >
                                                Up
                                              </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>

                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                              Change status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="w-44">
                                              {space.boardColumns
                                                ?.sort((a, b) => a.order - b.order)
                                                .map((col) => (
                                                  <DropdownMenuItem
                                                    key={col.id}
                                                    onClick={() =>
                                                      changeStatus(item, col.id)
                                                    }
                                                  >
                                                    {col.name}
                                                  </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>

                                          <DropdownMenuSeparator />

                                          <DropdownMenuItem
                                            onClick={() => toggleFlag(item)}
                                          >
                                            {item.flagged ? "Remove flag" : "Add flag"}
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                            onClick={() => openLabelDialog(item)}
                                          >
                                            Add label
                                          </DropdownMenuItem>

                                          <DropdownMenuSeparator />

                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setDeletingItem(item)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono">{item.key}</span>
                                        <StoryPoints
                                          value={item.storyPoints}
                                          onSave={async (newValue) => {
                                            const client = getGraphQLClient(
                                              token || undefined
                                            );
                                            await client.request(
                                              UPDATE_WORK_ITEM_DETAILS,
                                              {
                                                itemId: item.id,
                                                input: { storyPoints: newValue },
                                              }
                                            );
                                            fetchData();
                                          }}
                                        />
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {item.assignee && (
                                          <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {item.assignee.userName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        )}
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] px-1 py-0 h-5"
                                        >
                                          {item.priority}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </DraggableItem>
                          ))}
                        {/* INLINE CREATE INPUT (BOTTOM) */}
                        {creatingColumnId === column.id && columnItems.length > 0 && (
                          <div className="bg-background border rounded-md p-2 space-y-2">
                            <textarea
                              value={newTaskSummary}
                              autoFocus
                              onChange={(e) => {
                                setNewTaskSummary(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCreateWorkItem(column.id);
                                }
                                if (e.key === "Escape") {
                                  setCreatingColumnId(null);
                                  setNewTaskSummary("");
                                }
                              }}
                              placeholder="What needs to be done?"
                              className="w-full resize-none text-sm border rounded px-2 py-1 focus:outline-none"
                            />

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled={isCreating}
                                onClick={() => handleCreateWorkItem(column.id)}
                              >
                                {isCreating ? "..." : "✔"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCreatingColumnId(null);
                                  setNewTaskSummary("");
                                }}
                              >
                                ✖
                              </Button>
                            </div>
                          </div>
                        )}
                        {/* + Create (BOTTOM when items exist) */}
                        {hoveredColumnId === column.id && columnItems.length > 0 && (
                          <button
                            onClick={() => setCreatingColumnId(column.id)}
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                          >
                            + Create
                          </button>
                        )}
                      </DroppableColumn>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ================= DRAG OVERLAY ================= */}
          <DragOverlay>
            {activeItemId ? (
              <Card className="shadow-xl w-[260px] rotate-2">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">
                    {workItems.find((i) => i.id === activeItemId)?.summary}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>


      <EditWorkItemDialog
        workItemId={selectedWorkItemId}
        open={!!selectedWorkItemId}
        onOpenChange={(open) => !open && setSelectedWorkItemId(null)}
        onSuccess={fetchData}
        boardColumns={space.boardColumns || []}
        members={space.members || []}
      />
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={() => setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={handleDeleteItem}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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