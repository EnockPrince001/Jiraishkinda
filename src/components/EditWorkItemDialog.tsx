import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import {
  GET_WORK_ITEM_DETAILS,
  UPDATE_WORK_ITEM_DETAILS,
  ADD_COMMENT,
  CREATE_SUBTASK,
  UPDATE_WORK_ITEM
} from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { BoardColumn, SpaceMember } from "@/types";
import {
  CalendarIcon,
  Loader2,
  Plus,
  X,
  CheckSquare,
  Bookmark,
  MessageSquare,
  Clock,
  User,
  Flag,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Link2,
  MoreHorizontal,
  Share2,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface EditWorkItemDialogProps {
  workItemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  boardColumns: BoardColumn[];
  members: SpaceMember[];
}

interface WorkItemDetails {
  id: string;
  key: string;
  summary: string;
  description?: string;
  boardColumnId: string;
  priority: string;
  flagged: boolean;
  storyPoints?: number;
  sprintId?: string;
  dueDate?: string;
  createdDate: string;
  updatedDate: string;
  assignee?: { id: string; userName: string };
  reporter?: { id: string; userName: string };
  comments: Array<{
    id: string;
    content: string;
    createdDate: string;
    author: { id: string; userName: string };
  }>;
  subtasks: Array<{
    id: string;
    key: string;
    summary: string;
    boardColumnId: string;
    priority: string;
  }>;
}

// Safe date formatting helper
const safeFormatDate = (dateStr: string | undefined | null, formatStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

const safeFormatDistance = (dateStr: string | undefined | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'N/A';
  }
};

// Priority config with colors and icons
const priorityConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  CRITICAL: { label: "Critical", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  HIGH: { label: "High", color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: <ArrowUp className="h-3.5 w-3.5" /> },
  MEDIUM: { label: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: <Minus className="h-3.5 w-3.5" /> },
  LOW: { label: "Low", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <ArrowDown className="h-3.5 w-3.5" /> },
};


// Status config with colors
const getStatusColor = (columnName: string) => {
  const name = columnName?.toUpperCase() || "";
  if (name.includes("DONE") || name.includes("COMPLETE")) return "bg-green-500";
  if (name.includes("PROGRESS") || name.includes("REVIEW")) return "bg-blue-500";
  return "bg-gray-400";
};

export function EditWorkItemDialog({
  workItemId,
  open,
  onOpenChange,
  onSuccess,
  boardColumns = [],
  members = [],
}: EditWorkItemDialogProps) {
  const [workItem, setWorkItem] = useState<WorkItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local editable states - populated from workItem on fetch
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [boardColumnId, setBoardColumnId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState("MEDIUM");
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  // UI states
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  // Check if there are unsaved changes
  const hasChanges = workItem ? (
    summary !== workItem.summary ||
    description !== (workItem.description || "") ||
    boardColumnId !== workItem.boardColumnId ||
    assigneeId !== (workItem.assignee?.id || null) ||
    priority !== workItem.priority ||
    storyPoints !== (workItem.storyPoints ?? null) ||
    dueDate !== (workItem.dueDate || null)
  ) : false;

  useEffect(() => {
    if (open && workItemId) {
      fetchWorkItemDetails();
    }
  }, [open, workItemId]);

  // Reset local state when modal opens with new item
  useEffect(() => {
    if (workItem) {
      setSummary(workItem.summary);
      setDescription(workItem.description || "");
      setBoardColumnId(workItem.boardColumnId);
      setAssigneeId(workItem.assignee?.id || null);
      setPriority(workItem.priority);
      setStoryPoints(workItem.storyPoints ?? null);
      setDueDate(workItem.dueDate || null);
    }
  }, [workItem]);

  const fetchWorkItemDetails = async () => {
    if (!workItemId) return;

    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);
      const data: any = await client.request(GET_WORK_ITEM_DETAILS, { id: workItemId });
      setWorkItem(data.workItem);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load work item details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save all changes at once
  const handleSaveAll = async () => {
    if (!workItemId || !hasChanges) return;

    try {
      setSaving(true);
      const client = getGraphQLClient(token || undefined);

      const input: Record<string, any> = {};

      if (summary !== workItem?.summary) input.summary = summary.trim();
      if (description !== (workItem?.description || "")) input.description = description.trim() || null;
      if (boardColumnId !== workItem?.boardColumnId) input.boardColumnId = boardColumnId;
      if (assigneeId !== (workItem?.assignee?.id || null)) input.assigneeId = assigneeId;
      if (priority !== workItem?.priority) input.priority = priority;
      if (storyPoints !== (workItem?.storyPoints ?? null)) input.storyPoints = storyPoints;
      if (dueDate !== (workItem?.dueDate || null)) input.dueDate = dueDate;

      await client.request(UPDATE_WORK_ITEM_DETAILS, {
        itemId: workItemId,
        input,
      });

      await fetchWorkItemDetails();
      onSuccess();

      toast({
        title: "Saved",
        description: "All changes saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Discard changes and revert to original
  const handleDiscardChanges = () => {
    if (workItem) {
      setSummary(workItem.summary);
      setDescription(workItem.description || "");
      setBoardColumnId(workItem.boardColumnId);
      setAssigneeId(workItem.assignee?.id || null);
      setPriority(workItem.priority);
      setStoryPoints(workItem.storyPoints ?? null);
      setDueDate(workItem.dueDate || null);
    }
    setEditingSummary(false);
    setEditingDescription(false);
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Discard them?")) {
        handleDiscardChanges();
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleAddComment = async () => {
    if (!workItemId || !newComment.trim()) return;

    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(ADD_COMMENT, {
        workItemId,
        content: newComment.trim(),
      });

      setNewComment("");
      await fetchWorkItemDetails();

      toast({
        title: "Comment added",
        description: "Your comment was posted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleAddSubtask = async () => {
    if (!workItemId || !newSubtask.trim()) return;

    try {
      setAddingSubtask(true);
      const client = getGraphQLClient(token || undefined);
      await client.request(CREATE_SUBTASK, {
        parentWorkItemId: workItemId,
        input: {
          summary: newSubtask.trim(),
          priority: "MEDIUM",
        },
      });

      setNewSubtask("");
      setShowSubtaskInput(false);
      await fetchWorkItemDetails();
      onSuccess();

      toast({
        title: "Subtask created",
        description: "New subtask has been added",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create subtask",
        variant: "destructive",
      });
    } finally {
      setAddingSubtask(false);
    }
  };

  const currentColumn = boardColumns.find(c => c.id === boardColumnId);
  const priorityInfo = priorityConfig[priority || "MEDIUM"];

  if (!open) return null;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        <DialogTitle className="sr-only">Edit Work Item</DialogTitle>
        <DialogDescription className="sr-only">View and edit work item details, comments, and subtasks.</DialogDescription>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : workItem ? (
          <>
            {/* Premium Header Bar */}
            <div className="px-5 py-3 border-b bg-gradient-to-r from-background to-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Type Icon */}
                <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
                  <Bookmark className="h-3.5 w-3.5 text-white" />
                </div>
                {/* Key as link */}
                <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">
                  {workItem.key}
                </span>
                {/* Breadcrumb separator */}
                <span className="text-muted-foreground">/</span>
                {/* Parent project would go here */}
              </div>

              <div className="flex items-center gap-1">
                {hasChanges && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDiscardChanges}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="h-8 gap-1.5"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Save
                    </Button>
                    <Separator orientation="vertical" className="h-5 mx-1" />
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Column - Main Content */}
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Summary - Large Title */}
                  <div>
                    {editingSummary ? (
                      <Input
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="text-xl font-semibold h-auto py-2 px-3 border-2 border-primary rounded-lg"
                        autoFocus
                        onBlur={() => setEditingSummary(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            setEditingSummary(false);
                          }
                        }}
                      />
                    ) : (
                      <h1
                        className="text-xl font-semibold cursor-pointer hover:bg-muted/50 px-3 py-2 rounded-lg -ml-3 transition-colors"
                        onClick={() => setEditingSummary(true)}
                      >
                        {workItem.summary}
                      </h1>
                    )}
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      Attach
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => setShowSubtaskInput(true)}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Add subtask
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      Link issue
                    </Button>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</h3>
                    {editingDescription ? (
                      <div className="space-y-3">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a detailed description..."
                          className="min-h-[150px] resize-none border-2 focus:border-primary"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingDescription(false)}>Done</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDescription(workItem.description || "");
                              setEditingDescription(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "text-sm cursor-pointer hover:bg-muted/50 p-4 rounded-lg border-2 border-dashed min-h-[80px] whitespace-pre-wrap transition-colors",
                          description
                            ? "border-transparent bg-muted/30"
                            : "border-muted-foreground/20 text-muted-foreground italic"
                        )}
                        onClick={() => setEditingDescription(true)}
                      >
                        {description || "Click to add a description..."}
                      </div>
                    )}
                  </div>

                  {/* Subtasks Section */}
                  {(workItem.subtasks?.length > 0 || showSubtaskInput) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Child Issues
                          {workItem.subtasks?.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">{workItem.subtasks.length}</Badge>
                          )}
                        </h3>
                        {!showSubtaskInput && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowSubtaskInput(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        {workItem.subtasks?.map((subtask, index) => {
                          const subtaskColumn = boardColumns.find(c => c.id === subtask.boardColumnId);
                          const subtaskPriority = priorityConfig[subtask.priority];
                          return (
                            <div
                              key={subtask.id}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                                index !== 0 && "border-t"
                              )}
                            >
                              <CheckSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-xs font-mono text-primary">{subtask.key}</span>
                              <span className="flex-1 text-sm truncate">{subtask.summary}</span>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", subtaskPriority?.color)}
                              >
                                {subtaskPriority?.icon}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {subtaskColumn?.name || "Unknown"}
                              </Badge>
                            </div>
                          );
                        })}

                        {showSubtaskInput && (
                          <div className={cn("flex gap-2 p-3 bg-muted/20", workItem.subtasks?.length > 0 && "border-t")}>
                            <Input
                              placeholder="What needs to be done?"
                              value={newSubtask}
                              onChange={(e) => setNewSubtask(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddSubtask();
                                if (e.key === "Escape") {
                                  setNewSubtask("");
                                  setShowSubtaskInput(false);
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={handleAddSubtask}
                              disabled={!newSubtask.trim() || addingSubtask}
                            >
                              {addingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setNewSubtask("");
                                setShowSubtaskInput(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Activity Section */}
                  <div>
                    <Tabs defaultValue="comments" className="w-full">
                      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger
                          value="comments"
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Comments
                          {workItem.comments?.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">{workItem.comments.length}</Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="history"
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          History
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="comments" className="space-y-4 mt-4">
                        {/* Add Comment - Top */}
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                              ME
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[60px] resize-none"
                            />
                            {newComment.trim() && (
                              <Button size="sm" onClick={handleAddComment}>
                                Save
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Existing Comments */}
                        <div className="space-y-4">
                          {workItem.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-muted">
                                  {comment.author.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {safeFormatDistance(comment.createdDate)}
                                  </span>
                                </div>
                                <div className="text-sm bg-muted/40 p-3 rounded-lg whitespace-pre-wrap">
                                  {comment.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="history" className="mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Plus className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{workItem.reporter?.userName}</span>
                                <span className="text-muted-foreground"> created this issue</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {safeFormatDate(workItem.createdDate, "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          {workItem.updatedDate !== workItem.createdDate && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Last updated</p>
                                <p className="text-xs text-muted-foreground">
                                  {safeFormatDate(workItem.updatedDate, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>

              {/* Right Column - Details Sidebar */}
              <div className="w-[320px] shrink-0 border-l bg-muted/10">
                <ScrollArea className="h-full">
                  <div className="p-5 space-y-5">
                    {/* Status - Prominent */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                      <Select
                        value={boardColumnId}
                        onValueChange={setBoardColumnId}
                      >
                        <SelectTrigger className="w-full h-10 font-medium">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", getStatusColor(currentColumn?.name || ""))} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {boardColumns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", getStatusColor(column.name))} />
                                {column.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Assignee */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignee</Label>
                      <Select
                        value={assigneeId || "unassigned"}
                        onValueChange={(value) => setAssigneeId(value === "unassigned" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {assigneeId ? (
                                <>
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                      {members.find(m => m.user.id === assigneeId)?.user.userName.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{members.find(m => m.user.id === assigneeId)?.user.userName || "Unknown"}</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
                                  <span className="text-muted-foreground">Unassigned</span>
                                </>
                              )}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Unassigned</span>
                            </div>
                          </SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px]">
                                    {member.user.userName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.user.userName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reporter - Read Only */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporter</Label>
                      <div className="flex items-center gap-2 h-10 px-3 bg-muted/50 rounded-md">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                            {workItem.reporter?.userName.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{workItem.reporter?.userName || "Unknown"}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                      <Select
                        value={priority}
                        onValueChange={setPriority}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span className={priorityInfo?.color}>{priorityInfo?.icon}</span>
                              <span>{priorityInfo?.label}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className={config.color}>{config.icon}</span>
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Story Points */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Story Points</Label>
                      <Select
                        value={storyPoints?.toString() || "none"}
                        onValueChange={(value) => setStoryPoints(value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {[1, 2, 3, 5, 8, 13, 21].map((points) => (
                            <SelectItem key={points} value={points.toString()}>
                              {points} {points === 1 ? "point" : "points"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-10 justify-start text-left font-normal",
                              !dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? safeFormatDate(dueDate, "MMM d, yyyy") : "None"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDate ? new Date(dueDate) : undefined}
                            onSelect={(date) => setDueDate(date?.toISOString() || null)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                          {dueDate && (
                            <div className="p-2 border-t">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive"
                                onClick={() => setDueDate(null)}
                              >
                                Remove date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Timestamps */}
                    <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span>{safeFormatDistance(workItem.createdDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated</span>
                        <span>{safeFormatDistance(workItem.updatedDate)}</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Work item not found</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

