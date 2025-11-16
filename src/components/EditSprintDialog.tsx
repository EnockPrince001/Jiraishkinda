import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { UPDATE_SPRINT } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

interface EditSprintDialogProps {
  sprint: Sprint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const convertDateToISO = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  const date = new Date(Date.UTC(
    parseInt(dateString.substring(0, 4), 10),
    parseInt(dateString.substring(5, 7), 10) - 1,
    parseInt(dateString.substring(8, 10), 10)
  ));
  return date.toISOString();
};

const convertISOToDate = (isoString?: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
};

export function EditSprintDialog({ sprint, open, onOpenChange, onSuccess }: EditSprintDialogProps) {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal || "");
  const [startDate, setStartDate] = useState(convertISOToDate(sprint.startDate));
  const [endDate, setEndDate] = useState(convertISOToDate(sprint.endDate));
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setName(sprint.name);
    setGoal(sprint.goal || "");
    setStartDate(convertISOToDate(sprint.startDate));
    setEndDate(convertISOToDate(sprint.endDate));
  }, [sprint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const client = getGraphQLClient(token || undefined);
      const isoStartDate = convertDateToISO(startDate);
      const isoEndDate = convertDateToISO(endDate);

      await client.request(UPDATE_SPRINT, {
        sprintId: sprint.id,
        input: {
          name,
          ...(goal && { goal }),
          ...(isoStartDate && { startDate: isoStartDate }),
          ...(isoEndDate && { endDate: isoEndDate }),
        },
      });
      toast({
        title: "Success",
        description: "Sprint updated successfully",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sprint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>
            Update sprint details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Sprint Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal">Sprint Goal</Label>
              <Input
                id="edit-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is the goal of this sprint?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
