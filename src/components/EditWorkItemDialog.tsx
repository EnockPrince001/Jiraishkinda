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
import { CalendarIcon, Loader2, Plus, X, CheckSquare } from "lucide-react";
import { format } from "date-fns";
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

  // Editable states
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && workItemId) {
      fetchWorkItemDetails();
    }
  }, [open, workItemId]);

  const fetchWorkItemDetails = async () => {
    if (!workItemId) return;

    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);
      const data: any = await client.request(GET_WORK_ITEM_DETAILS, { id: workItemId });

      setWorkItem(data.workItem);
      setSummary(data.workItem.summary);
      setDescription(data.workItem.description || "");
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

  const updateField = async (field: string, value: any) => {
    if (!workItemId) return;

    try {
      setSaving(true);
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM_DETAILS, {
        itemId: workItemId,
        input: { [field]: value },
      });

      await fetchWorkItemDetails();
      onSuccess();

      toast({
        title: "Success",
        description: "Work item updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update work item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSummary = () => {
    if (summary.trim() && summary !== workItem?.summary) {
      updateField("summary", summary.trim());
    }
    setEditingSummary(false);
  };

  const handleSaveDescription = () => {
    if (description !== workItem?.description) {
      updateField("description", description.trim() || null);
    }
    setEditingDescription(false);
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
        title: "Success",
        description: "Comment added",
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
        title: "Success",
        description: "Subtask created",
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

  const handleStatusChange = async (newColumnId: string) => {
    if (!workItemId) return;

    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM, {
        itemId: workItemId,
        boardColumnId: newColumnId,
      });

      await fetchWorkItemDetails();
      onSuccess();

      toast({
        title: "Success",
        description: "Status updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Edit Work Item</DialogTitle>
        <DialogDescription className="sr-only">View and edit work item details, comments, and subtasks.</DialogDescription>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : workItem ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{workItem.key}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Column - Main Content (65%) */}
              <ScrollArea className="flex-1 border-r">
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div>
                    {editingSummary ? (
                      <Input
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="text-2xl font-semibold h-auto py-2 border-2 border-primary"
                        autoFocus
                        onBlur={handleSaveSummary}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSummary();
                          if (e.key === "Escape") {
                            setSummary(workItem.summary);
                            setEditingSummary(false);
                          }
                        }}
                      />
                    ) : (
                      <h2
                        className="text-2xl font-semibold cursor-pointer hover:bg-muted/50 px-3 py-2 rounded -ml-3"
                        onClick={() => setEditingSummary(true)}
                      >
                        {workItem.summary}
                      </h2>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Description</Label>
                    {editingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description..."
                          className="min-h-[150px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveDescription}>Save</Button>
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
                          "text-sm cursor-pointer hover:bg-muted/50 p-4 rounded border min-h-[100px] whitespace-pre-wrap",
                          !workItem.description && "text-muted-foreground italic"
                        )}
                        onClick={() => setEditingDescription(true)}
                      >
                        {workItem.description || "Add a description..."}
                      </div>
                    )}
                  </div>

                  {/* Subtasks */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Subtasks</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => setShowSubtaskInput(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create subtask
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {workItem.subtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 transition-colors"
                        >
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs font-mono">{subtask.key}</Badge>
                          <span className="flex-1 text-sm">{subtask.summary}</span>
                          <Badge variant="secondary" className="text-xs">
                            {boardColumns.find(c => c.id === subtask.boardColumnId)?.name || "Unknown"}
                          </Badge>
                        </div>
                      ))}

                      {showSubtaskInput && (
                        <div className="flex gap-2 p-2 border rounded bg-muted/20">
                          <Input
                            placeholder="Subtask summary..."
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask();
                              if (e.key === "Escape") {
                                setNewSubtask("");
                                setShowSubtaskInput(false);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleAddSubtask}
                            disabled={!newSubtask.trim() || addingSubtask}
                          >
                            {addingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
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

                  <Separator />

                  {/* Activity / Comments */}
                  <div>
                    <Tabs defaultValue="comments" className="w-full">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>

                      <TabsContent value="comments" className="space-y-4 mt-4">
                        {/* Existing Comments */}
                        <div className="space-y-4">
                          {workItem.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {comment.author.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{comment.author.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.createdDate), "MMM d, yyyy 'at' h:mm a")}
                                  </span>
                                </div>
                                <div className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap">
                                  {comment.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-3 pt-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">ME</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                              Add Comment
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="history" className="mt-4">
                        <div className="text-sm text-muted-foreground p-4 text-center border rounded bg-muted/20 space-y-1">
                          <p><strong>Created:</strong> {workItem.createdDate ? format(new Date(workItem.createdDate), "MMM d, yyyy 'at' h:mm a") : 'N/A'}</p>
                          <p><strong>Updated:</strong> {workItem.updatedDate ? format(new Date(workItem.updatedDate), "MMM d, yyyy 'at' h:mm a") : 'N/A'}</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>

              {/* Right Column - Metadata Sidebar (35%) */}
              <div className="w-80 shrink-0 bg-muted/20">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-5">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h3>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select
                        value={workItem.boardColumnId}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {boardColumns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Assignee</Label>
                      <Select
                        value={workItem.assignee?.id || "unassigned"}
                        onValueChange={(value) =>
                          updateField("assigneeId", value === "unassigned" ? null : value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {workItem.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px]">
                                    {workItem.assignee.userName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{workItem.assignee.userName}</span>
                              </div>
                            ) : (
                              "Unassigned"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
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

                    {/* Reporter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reporter</Label>
                      <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {workItem.reporter?.userName.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{workItem.reporter?.userName || "Unknown"}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Priority</Label>
                      <Select
                        value={workItem.priority}
                        onValueChange={(value) => updateField("priority", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Story Points */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Story Points</Label>
                      <Input
                        type="number"
                        min="0"
                        value={workItem.storyPoints || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          updateField("storyPoints", value);
                        }}
                        placeholder="None"
                      />
                    </div>

                    <Separator />

                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !workItem.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {workItem.dueDate ? format(new Date(workItem.dueDate), "PPP") : "Set date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={workItem.dueDate ? new Date(workItem.dueDate) : undefined}
                            onSelect={(date) => updateField("dueDate", date?.toISOString())}
                            initialFocus
                            className="pointer-events-auto"
                          />
                          {workItem.dueDate && (
                            <div className="p-3 border-t">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full"
                                onClick={() => updateField("dueDate", null)}
                              >
                                Clear Date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            Work item not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
