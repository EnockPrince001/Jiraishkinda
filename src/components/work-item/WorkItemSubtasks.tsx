import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus } from "lucide-react";
import { WorkItemDetailsType } from "../EditWorkItemDialog";
import { getGraphQLClient } from "@/lib/graphql-client";
import { CREATE_SUBTASK } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkItemSubtasksProps {
  workItem: WorkItemDetailsType;
  fetchWorkItemDetails: () => Promise<void>;
}

export function WorkItemSubtasks({ workItem, fetchWorkItemDetails }: WorkItemSubtasksProps) {
  const [showInput, setShowInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const { token } = useAuth();
  const { toast } = useToast();

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(CREATE_SUBTASK, {
        parentWorkItemId: workItem.id,
        input: { summary: newSubtask.trim(), priority: "MEDIUM" },
      });
      setNewSubtask("");
      setShowInput(false);
      await fetchWorkItemDetails();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create subtask", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">Subtasks</h3>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowInput(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add subtask
        </Button>
      </div>
      <div className="border rounded-md divide-y overflow-hidden">
        {workItem.subtasks?.map((st) => (
          <div key={st.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
            <CheckSquare className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-mono text-muted-foreground shrink-0">{st.key}</span>
            <span className="text-sm flex-1 truncate">{st.summary}</span>
          </div>
        ))}
        {showInput && (
          <div className="p-2 bg-slate-50 flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
            <Button size="sm" onClick={handleAddSubtask}>Create</Button>
          </div>
        )}
      </div>
    </div>
  );
}
