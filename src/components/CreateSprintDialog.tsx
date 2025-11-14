// src/components/CreateSprintDialog.tsx
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
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { CREATE_SPRINT } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface CreateSprintDialogProps {
  spaceId: string;
  onSuccess?: () => void;
}

// Helper function to convert YYYY-MM-DD string to ISO string at start of day (UTC)
// Example: "2025-11-21" -> "2025-11-21T00:00:00.000Z"
const convertDateToISO = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  // Create a Date object, assuming the input string is YYYY-MM-DD
  // Using Date.UTC to avoid timezone issues and ensure it represents midnight UTC
  const date = new Date(Date.UTC(
    parseInt(dateString.substring(0, 4), 10), // year
    parseInt(dateString.substring(5, 7), 10) - 1, // month (0-indexed)
    parseInt(dateString.substring(8, 10), 10)  // day
  ));
  return date.toISOString();
};

export function CreateSprintDialog({ spaceId, onSuccess }: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(""); // Raw string from input
  const [endDate, setEndDate] = useState("");     // Raw string from input
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const client = getGraphQLClient(token || undefined);

      // Convert date strings to ISO format before sending
      const isoStartDate = convertDateToISO(startDate);
      const isoEndDate = convertDateToISO(endDate);

      await client.request(CREATE_SPRINT, {
        input: {
          name,
          spaceId,
          ...(goal && { goal }),
          ...(isoStartDate && { startDate: isoStartDate }), // Send ISO string or omit if undefined
          ...(isoEndDate && { endDate: isoEndDate }),       // Send ISO string or omit if undefined
        },
      });
      toast({
        title: "Success",
        description: "Sprint created successfully",
      });
      setName("");
      setGoal("");
      setStartDate("");
      setEndDate("");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sprint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
          <DialogDescription>
            Create a new sprint for your team
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sprint Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Sprint Goal</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is the goal of this sprint?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} // Store raw string
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} // Store raw string
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}