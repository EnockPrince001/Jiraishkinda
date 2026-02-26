import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BoardColumn, SpaceMember } from "@/types";
import { GET_WORK_ITEM_DETAILS, UPDATE_WORK_ITEM_DETAILS } from "@/lib/queries";
import { Button } from "@/components/ui/button";


import { WorkItemHeader } from "./work-item/WorkItemHeader";
import { WorkItemDetails } from "./work-item/WorkItemDetails";
import { WorkItemSubtasks } from "./work-item/WorkItemSubtasks";
import { WorkItemComments } from "./work-item/WorkItemComments";

export interface EditWorkItemDialogProps {
  workItemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  boardColumns: BoardColumn[];
  members: SpaceMember[];
}

export interface WorkItemDetailsType {
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
  const [workItem, setWorkItem] = useState<WorkItemDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  // FETCH WORK ITEM DETAILS
  const fetchWorkItemDetails = async () => {
    if (!workItemId) return;
    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);
      const data: any = await client.request(GET_WORK_ITEM_DETAILS, { id: workItemId });
      setWorkItem(data.workItem);
      setDescription(data.workItem.description || "");
    } catch (error) {
      toast({ title: "Error", description: "Failed to load task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && workItemId) fetchWorkItemDetails();
  }, [open, workItemId]);

  // SAVE DESCRIPTION INLINE
  const handleSaveDescription = async () => {
    if (!workItem) return;
    try {
      setSavingDescription(true);
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM_DETAILS, {
        itemId: workItem.id,
        input: { description }
      });
      await fetchWorkItemDetails();
      setEditingDescription(false);
      toast({ title: "Success", description: "Description updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update description", variant: "destructive" });
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg border-none shadow-2xl">
        <DialogTitle className="sr-only">Task Detail</DialogTitle>
        <DialogDescription className="sr-only">Jira-style task view</DialogDescription>

        {loading || !workItem ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* HEADER */}
            <WorkItemHeader
              workItem={workItem}
              fetchWorkItemDetails={fetchWorkItemDetails}
              onSuccess={onSuccess}
            />

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden border-t">
              {/* LEFT COLUMN */}
              <ScrollArea className="flex-[7] p-8 space-y-8">

                {/* DESCRIPTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-600">Description</h3>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[120px] w-full p-2 border rounded"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription} disabled={savingDescription}>
                          {savingDescription ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setDescription(workItem.description || "");
                          setEditingDescription(false);
                        }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-[15px] leading-relaxed cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded min-h-[40px]"
                      onClick={() => setEditingDescription(true)}
                    >
                      {description || <span className="text-muted-foreground italic">Add a description...</span>}
                    </div>
                  )}
                </div>

                {/* SUBTASKS */}
                <WorkItemSubtasks workItem={workItem} fetchWorkItemDetails={fetchWorkItemDetails} />

                {/* COMMENTS */}
                <WorkItemComments workItem={workItem} fetchWorkItemDetails={fetchWorkItemDetails} />

              </ScrollArea>

              {/* RIGHT COLUMN (Sidebar) */}
              <WorkItemDetails
                workItem={workItem}
                boardColumns={boardColumns}
                members={members}
                onUpdate={fetchWorkItemDetails}
              />
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
