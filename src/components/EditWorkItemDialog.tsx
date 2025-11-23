import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
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
    Plus,
    X,
    Share2,
    MoreHorizontal,
    LayoutList,
    Clock,
    Paperclip,
    Link as LinkIcon,
    History
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
import { WorkItem, BoardColumn, SpaceMember } from "@/types";

interface EditWorkItemDialogProps {
    workItemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    boardColumns: BoardColumn[];
    members: SpaceMember[]; // <--- ADDED: Needed for Assignee dropdown
}

export function EditWorkItemDialog({
    workItemId,
    open,
    onOpenChange,
    onSuccess,
    boardColumns,
    members = [], // Default to empty array to prevent crashes
}: EditWorkItemDialogProps) {
    const [item, setItem] = useState<WorkItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [subtaskSummary, setSubtaskSummary] = useState("");
    const [isSubtaskInputVisible, setIsSubtaskInputVisible] = useState(false);

    // Edit states
    const [summary, setSummary] = useState("");
    const [isEditingSummary, setIsEditingSummary] = useState(false);

    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    // Start Date state (Placeholder for when BE supports it)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);

    const { token } = useAuth();
    const { toast } = useToast();
    const summaryInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

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
            // setStartDate(fetchedItem.startDate ? new Date(fetchedItem.startDate) : undefined); // Enable when BE supports it
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

    useEffect(() => {
        if (isEditingSummary && summaryInputRef.current) {
            summaryInputRef.current.focus();
        }
    }, [isEditingSummary]);

    useEffect(() => {
        if (isEditingDescription && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
        }
    }, [isEditingDescription]);

    const handleUpdate = async (field: string, value: any) => {
        if (!workItemId) return;

        try {
            const client = getGraphQLClient(token || undefined);
            await client.request(UPDATE_WORK_ITEM_DETAILS, {
                itemId: workItemId,
                input: { [field]: value },
            });

            // Optimistic update
            if (item) {
                if (field === 'assigneeId') {
                    // Find the user object for optimistic update
                    const newAssignee = members.find(m => m.user.id === value)?.user;
                    setItem({ ...item, assignee: newAssignee });
                } else {
                    setItem({ ...item, [field]: value });
                }
            }
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

    const handleSummarySave = () => {
        setIsEditingSummary(false);
        if (summary !== item?.summary) {
            handleUpdate('summary', summary);
        }
    };

    const handleDescriptionSave = () => {
        setIsEditingDescription(false);
        if (description !== item?.description) {
            handleUpdate('description', description);
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
            fetchDetails();
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
                    // Default to first column if specific one not found
                    boardColumnId: boardColumns.find(c => c.isSystem && c.name === "TO DO")?.id || boardColumns[0]?.id,
                    spaceId: "00000000-0000-0000-0000-000000000000", // Dummy, handled by BE
                    key: "TEMP",
                },
            });

            setSubtaskSummary("");
            setIsSubtaskInputVisible(false);
            fetchDetails();
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

    // Helper to find current status name
    const currentStatusName = boardColumns.find(c => c.id === item?.boardColumnId)?.name || "Unknown";

    // Helper for status colors
    const getStatusColor = (statusName: string) => {
        const name = statusName.toUpperCase();
        if (name.includes('DONE') || name.includes('COMPLETE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (name.includes('PROGRESS')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
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
            <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background shadow-2xl border-none sm:rounded-xl">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b bg-background/95 backdrop-blur z-10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LayoutList className="h-4 w-4 text-primary" />
                        <span className="hover:underline cursor-pointer">{item.key ? item.key.split('-')[0] : '...'}</span>
                        <span>/</span>
                        <span className="font-medium text-foreground hover:underline cursor-pointer">{item.key}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground ml-1" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT COLUMN: Main Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-8 max-w-4xl space-y-8">

                            {/* Title */}
                            <div className="space-y-4">
                                <div className="group">
                                    {isEditingSummary ? (
                                        <Input
                                            ref={summaryInputRef}
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            onBlur={handleSummarySave}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSummarySave()}
                                            className="text-2xl font-semibold h-auto py-2 px-2 -ml-2"
                                        />
                                    ) : (
                                        <h1
                                            onClick={() => setIsEditingSummary(true)}
                                            className="text-2xl font-semibold hover:bg-muted/50 p-2 -ml-2 rounded cursor-text transition-colors text-foreground"
                                        >
                                            {summary}
                                        </h1>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-secondary/50 hover:bg-secondary">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Attach
                                    </Button>
                                    <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-secondary/50 hover:bg-secondary">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add child issue
                                    </Button>
                                    <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-secondary/50 hover:bg-secondary">
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        Link issue
                                    </Button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">Description</Label>
                                {isEditingDescription ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            ref={descriptionInputRef}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[150px] resize-none"
                                            placeholder="Add a description..."
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleDescriptionSave}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setDescription(item.description || "");
                                                setIsEditingDescription(false);
                                            }}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsEditingDescription(true)}
                                        className={cn(
                                            "min-h-[100px] p-3 rounded-md hover:bg-muted/50 cursor-text transition-colors text-sm whitespace-pre-wrap",
                                            !description && "text-muted-foreground italic"
                                        )}
                                    >
                                        {description || "Add a description..."}
                                    </div>
                                )}
                            </div>

                            {/* Subtasks */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Subtasks</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-muted-foreground hover:text-primary"
                                        onClick={() => setIsSubtaskInputVisible(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        Create subtask
                                    </Button>
                                </div>

                                <div className="space-y-1">
                                    {item.subtasks?.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-md group transition-colors border border-transparent hover:border-border/50">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-muted p-1 rounded">
                                                    <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground">{subtask.key}</span>
                                                <span className="text-sm text-foreground">{subtask.summary}</span>
                                            </div>
                                            <Badge variant="outline" className="h-5 text-[10px] font-normal text-muted-foreground bg-background">
                                                {boardColumns.find(c => c.id === subtask.boardColumnId)?.name || 'Unknown'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {isSubtaskInputVisible && (
                                    <div className="flex gap-2 items-center p-2 bg-muted/30 rounded-md border border-dashed border-border">
                                        <Input
                                            value={subtaskSummary}
                                            onChange={(e) => setSubtaskSummary(e.target.value)}
                                            placeholder="What needs to be done?"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                            autoFocus
                                            className="h-8 bg-background"
                                        />
                                        <Button size="sm" className="h-8" onClick={handleAddSubtask}>Create</Button>
                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsSubtaskInputVisible(false)}>Cancel</Button>
                                    </div>
                                )}
                            </div>

                            {/* Activity */}
                            <div className="space-y-6 pt-6 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Activity</Label>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs font-medium">Show: All</Button>
                                        <Button variant="secondary" size="sm" className="h-7 text-xs font-medium">Comments</Button>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs font-medium">History</Button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 mt-1 shadow-sm">
                                        ME
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <Textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="min-h-[80px] resize-none pr-12 py-3"
                                            />
                                        </div>
                                        {commentText.trim() && (
                                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Button size="sm" onClick={handleAddComment}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setCommentText("")}>Cancel</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 pl-12 relative before:absolute before:left-[27px] before:top-4 before:bottom-0 before:w-px before:bg-border/50">
                                    {item.comments?.map((comment) => (
                                        <div key={comment.id} className="relative group">
                                            <div className="absolute -left-12 top-1 w-2 h-2 rounded-full bg-muted-foreground/30 ring-4 ring-background group-hover:bg-primary/50 transition-colors" />
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-foreground">{comment.author?.userName || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(comment.createdDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-foreground/90 bg-muted/20 p-3 rounded-md">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* RIGHT COLUMN: Sidebar / Meta Info */}
                    <div className="w-[400px] border-l bg-muted/5 p-6 space-y-8 overflow-y-auto shrink-0 custom-scrollbar">

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                            <Select
                                value={item.boardColumnId}
                                onValueChange={(val) => handleUpdate('boardColumnId', val)}
                            >
                                <SelectTrigger className={cn("w-full font-semibold border-transparent shadow-sm transition-colors h-10", getStatusColor(currentStatusName))}>
                                    <SelectValue placeholder={currentStatusName} />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    {boardColumns.map((col) => (
                                        <SelectItem key={col.id} value={col.id} className="font-medium">
                                            {col.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Details Group */}
                        <div className="space-y-4 border rounded-lg p-4 bg-background shadow-sm">
                            <h3 className="font-semibold text-sm text-foreground border-b pb-2 mb-3">Details</h3>

                            {/* Assignee - NOW EDITABLE */}
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <span className="text-sm text-muted-foreground">Assignee</span>
                                <Select
                                    value={item.assignee?.id || "unassigned"}
                                    onValueChange={(val) => handleUpdate('assigneeId', val === "unassigned" ? null : val)}
                                >
                                    <SelectTrigger className="h-8 border-transparent hover:bg-muted px-2 -ml-2 w-fit min-w-[140px] focus:ring-0 p-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                {item.assignee?.userName?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                            <span className="text-sm text-foreground">{item.assignee?.userName || "Unassigned"}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {members.map((member) => (
                                            <SelectItem key={member.user.id} value={member.user.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                                                        {member.user.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{member.user.userName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reporter (Read Only) */}
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <span className="text-sm text-muted-foreground">Reporter</span>
                                <div className="flex items-center gap-2 p-1.5 -ml-1.5">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                        {item.reporter?.userName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <span className="text-sm text-foreground">{item.reporter?.userName || "Unknown"}</span>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <span className="text-sm text-muted-foreground">Priority</span>
                                <Select
                                    value={item.priority}
                                    onValueChange={(val) => handleUpdate('priority', val)}
                                >
                                    <SelectTrigger className="h-8 border-transparent hover:bg-muted px-2 -ml-2 w-fit min-w-[100px] focus:ring-0">
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

                            {/* Story Points */}
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <span className="text-sm text-muted-foreground">Story Points</span>
                                <Input
                                    type="number"
                                    value={storyPoints || ''}
                                    onChange={(e) => setStoryPoints(parseInt(e.target.value) || undefined)}
                                    onBlur={() => storyPoints !== item.storyPoints && handleUpdate('storyPoints', storyPoints)}
                                    className="h-8 w-20 bg-transparent"
                                    placeholder="-"
                                />
                            </div>
                        </div>

                        {/* Dates Group */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dates</Label>
                            <div className="text-sm text-muted-foreground space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    {/* Start Date (Placeholder) */}
                                    <span className="flex items-center gap-1.5">Start Date</span>
                                    <Button variant="ghost" size="sm" className="h-auto p-0 font-normal text-muted-foreground hover:text-primary" disabled>
                                        Not Set
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="flex items-center gap-1.5">
                                        Due Date
                                    </span>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"ghost"}
                                                size="sm"
                                                className={cn(
                                                    "h-auto p-0 font-normal hover:bg-transparent hover:text-primary",
                                                    !dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground hover:text-primary cursor-pointer">Set date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
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
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}