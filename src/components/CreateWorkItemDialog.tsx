import { useState } from "react";
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
import { CREATE_WORK_ITEM } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface CreateWorkItemDialogProps {
  spaceId: string;
  sprintId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateWorkItemDialog({
  spaceId,
  sprintId,
  onSuccess,
  trigger
}: CreateWorkItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  // REMOVED: const [status, setStatus] = useState(...) 

  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setLoading(true);
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(CREATE_WORK_ITEM, {
        input: {
          summary,
          priority,
          // REMOVED: status, 
          spaceId,
          ...(sprintId && { sprintId }),
        },
      });

      toast({
        title: "Success",
        description: "Work item created successfully",
      });

      setSummary("");
      setPriority("MEDIUM");
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
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter work item summary"
                required
              />
            </div>

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

            {/* REMOVED: Status Select Field - items auto-assign to first column */}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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