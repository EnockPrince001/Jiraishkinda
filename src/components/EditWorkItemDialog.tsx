import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Calendar as CalendarIcon,
    CheckSquare,
    User,
    Plus
} from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import {
    GET_WORK_ITEM_DETAILS,
    UPDATE_WORK_ITEM_DETAILS,
    ADD_COMMENT,
    CREATE_SUBTASK
} from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WorkItem, BoardColumn } from "@/types";

interface EditWorkItemDialogProps {
    workItemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    boardColumns: BoardColumn[];
}

export function EditWorkItemDialog({
    workItemId,
    open,
    onOpenChange,
    onSuccess,
    boardColumns,
}: EditWorkItemDialogProps) {
    const [item, setItem] = useState<WorkItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [subtaskSummary, setSubtaskSummary] = useState("");
    const [isSubtaskInputVisible, setIsSubtaskInputVisible] = useState(false);

    // Edit states
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

    const { token } = useAuth();
    const { toast } = useToast();

    const fetchDetails = async () => {
        if (!workItemId || !open) return;

        try {
            setLoading(true);
            const client = getGraphQLClient(token || undefined);
            const data: any = await client.request(GET_WORK_ITEM_DETAILS, { id: workItemId });
            const fetchedItem = data.workItem;

            setItem(fetchedItem);
            setSummary(fetchedItem.summary);
            setDescription(fetchedItem.description || "");
            setStoryPoints(fetchedItem.storyPoints);
            setDueDate(fetchedItem.dueDate ? new Date(fetchedItem.dueDate) : undefined);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load work item details",
                variant: "destructive",
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && workItemId) {
            fetchDetails();
        }
    }, [open, workItemId]);

    const handleUpdate = async (field: string, value: any) => {
        if (!workItemId) return;

        try {
            const client = getGraphQLClient(token || undefined);

            await client.request(UPDATE_WORK_ITEM_DETAILS, {
                itemId: workItemId,
                input: { [field]: value },
            });

            // Update local item state immediately for UI responsiveness
            if (item) {
                // @ts-ignore - Dynamic field update
                setItem({ ...item, [field]: value });
            }

            // Notify parent to refresh board/list
            onSuccess?.();

            toast({
                title: "Updated",
                description: `${field} updated successfully`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to update",
                variant: "destructive",
            });
        }
    };

    const handleAddComment = async () => {
        if (!workItemId || !commentText.trim()) return;

        try {
            const client = getGraphQLClient(token || undefined);
            await client.request(ADD_COMMENT, {
                workItemId: workItemId,
                content: commentText,
            });

            setCommentText("");
            fetchDetails(); // Refresh to show new comment
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
        if (!workItemId || !subtaskSummary.trim()) return;

        try {
            const client = getGraphQLClient(token || undefined);
            await client.request(CREATE_SUBTASK, {
                parentWorkItemId: workItemId,
                input: {
                    summary: subtaskSummary,
                    priority: "MEDIUM",
                    boardColumnId: boardColumns.find(c => c.isSystem && c.name === "TO DO")?.id || boardColumns[0]?.id,
                    spaceId: "00000000-0000-0000-0000-000000000000", // Dummy GUID, Backend handles logic
                    key: "TEMP", // Backend generates this
                    type: "SCRUM" // Enum filler
                },
            });

            setSubtaskSummary("");
            setIsSubtaskInputVisible(false);
            fetchDetails(); // Refresh to show new subtask
            toast({
                title: "Success",
                description: "Subtask created",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to create subtask",
                variant: "destructive",
            });
        }
    };

    if (!item && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center h-40">Loading...</div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.key}</Badge>
                        <span className="text-sm text-muted-foreground">/</span>
                        <Input
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            onBlur={() => summary !== item.summary && handleUpdate('summary', summary)}
                            className="h-8 w-[400px] font-medium bg-transparent border-transparent hover:border-input focus:border-input transition-colors"
                            maxLength={255}
                        />
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8 pr-6">
                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={() => description !== item.description && handleUpdate('description', description)}
                                    placeholder="Add a description..."
                                    className="min-h-[150px] resize-none"
                                />
                            </div>

                            {/* Subtasks */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Subtasks</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsSubtaskInputVisible(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add subtask
                                    </Button>
                                </div>

                                {isSubtaskInputVisible && (
                                    <div className="flex gap-2">
                                        <Input
                                            value={subtaskSummary}
                                            onChange={(e) => setSubtaskSummary(e.target.value)}
                                            placeholder="What needs to be done?"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleAddSubtask}>Add</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsSubtaskInputVisible(false)}>Cancel</Button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {item.subtasks?.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center justify-between p-2 border rounded-md bg-card">
                                            <div className="flex items-center gap-2">
                                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                                <span className={subtask.boardColumnId === boardColumns.find(c => c.name === 'DONE')?.id ? 'line-through text-muted-foreground' : ''}>
                                                    {subtask.summary}
                                                </span>
                                            </div>
                                            <Badge variant="outline">
                                                {boardColumns.find(c => c.id === subtask.boardColumnId)?.name || 'Unknown'}
                                            </Badge>
                                        </div>
                                    ))}
                                    {(!item.subtasks || item.subtasks.length === 0) && !isSubtaskInputVisible && (
                                        <p className="text-sm text-muted-foreground italic">No subtasks</p>
                                    )}
                                </div>
                            </div>

                            {/* Activity / Comments */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Activity</Label>

                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        ME
                                    </div>
                                    <div className="flex-1 gap-2">
                                        <Textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="min-h-[80px] mb-2"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    {item.comments?.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                                {comment.author?.userName?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{comment.author?.userName || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(comment.createdDate).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/90">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Sidebar */}
                    <div className="w-[300px] border-l bg-muted/10 p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Status</Label>
                                <Select
                                    value={item.boardColumnId}
                                    onValueChange={(val) => handleUpdate('boardColumnId', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boardColumns.map((col) => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {col.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Priority</Label>
                                <Select
                                    value={item.priority}
                                    onValueChange={(val) => handleUpdate('priority', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Story Points</Label>
                                <Input
                                    type="number"
                                    value={storyPoints || ''}
                                    onChange={(e) => setStoryPoints(parseInt(e.target.value) || undefined)}
                                    onBlur={() => storyPoints !== item.storyPoints && handleUpdate('storyPoints', storyPoints)}
                                    placeholder="Estimate"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Assignee</Label>
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm truncate">
                                        {item.assignee?.userName || "Unassigned"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Due Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dueDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={(date) => {
                                                setDueDate(date);
                                                handleUpdate('dueDate', date?.toISOString());
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Created</span>
                                    <span>{new Date(item.createdDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Updated</span>
                                    <span>{new Date(item.updatedDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}