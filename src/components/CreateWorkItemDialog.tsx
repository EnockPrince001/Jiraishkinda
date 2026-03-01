import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { CREATE_WORK_ITEM, GET_BOARD_COLUMNS_BY_SPACE_ID } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

const MAX_SUMMARY_LENGTH = 150;

interface BoardColumn {
  id: string;
  name: string;
  order: number;
  isSystem: boolean;
}

interface CreateWorkItemDialogProps {
  spaceId: string;          // ✅ REQUIRED
  sprintId?: string;
  initialBoardColumnId?: string; // Optional: Pre-select a specific column
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateWorkItemDialog({
  spaceId,
  sprintId,
  initialBoardColumnId,
  onSuccess,
  trigger,
}: CreateWorkItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [type, setType] = useState("TASK");
  const [boardColumnId, setBoardColumnId] = useState<string>(initialBoardColumnId || "");
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCols, setFetchingCols] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  const fetchBoardColumns = async () => {
    if (!spaceId) return;
    try {
      setFetchingCols(true);
      const client = getGraphQLClient(token || undefined);
      const data: any = await client.request(GET_BOARD_COLUMNS_BY_SPACE_ID, { spaceId });

      const columns = data.boardColumnsBySpaceId || [];
      setBoardColumns(columns);

      if (columns.length > 0 && !boardColumnId && !initialBoardColumnId) {
        setBoardColumnId(columns[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch board columns:", error);
    } finally {
      setFetchingCols(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBoardColumns();
    }
  }, [open, spaceId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!summary.trim()) return;

    if (summary.length > MAX_SUMMARY_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Summary must be ${MAX_SUMMARY_LENGTH} characters or less`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const client = getGraphQLClient(token || undefined);

      await client.request(CREATE_WORK_ITEM, {
        input: {
          spaceId,
          summary,
          priority,
          type,
          ...(boardColumnId ? { boardColumnId } : {}),
          ...(sprintId ? { sprintId } : {}),
        },
      });

      toast({
        title: "Success",
        description: "Work item created successfully",
      });

      setSummary("");
      setPriority("MEDIUM");
      setType("TASK");
      setBoardColumnId(initialBoardColumnId || "");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create work item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Issue
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>
            Add a new work item to your space
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="summary">Summary *</Label>
                <span
                  className={`text-xs ${summary.length > MAX_SUMMARY_LENGTH
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                    }`}
                >
                  {summary.length}/{MAX_SUMMARY_LENGTH}
                </span>
              </div>

              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter work item summary"
                required
                maxLength={MAX_SUMMARY_LENGTH + 10}
                className={
                  summary.length > MAX_SUMMARY_LENGTH
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />

              {summary.length > MAX_SUMMARY_LENGTH && (
                <p className="text-xs text-destructive">
                  Summary is too long
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">Task</SelectItem>
                  <SelectItem value="STORY">Story</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="EPIC">Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
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

            {/* Status (Board Column) */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={boardColumnId}
                onValueChange={setBoardColumnId}
                disabled={fetchingCols || boardColumns.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fetchingCols ? "Loading..." : "Select status"} />
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

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
