import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Bookmark, Lock, Eye, Share2, MoreHorizontal, Maximize2 } from "lucide-react";
import { WorkItemDetailsType } from "../EditWorkItemDialog";
import { getGraphQLClient } from "@/lib/graphql-client";
import { UPDATE_WORK_ITEM_DETAILS } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkItemHeaderProps {
  workItem: WorkItemDetailsType;
  onSuccess: () => void;
  fetchWorkItemDetails: () => Promise<void>;
}

export function WorkItemHeader({
  workItem,
  onSuccess,
  fetchWorkItemDetails,
}: WorkItemHeaderProps) {
  const [editingSummary, setEditingSummary] = useState(false);
  const [summary, setSummary] = useState(workItem.summary);
  const [saving, setSaving] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!summary.trim() || summary === workItem.summary) return;
    try {
      setSaving(true);
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM_DETAILS, { itemId: workItem.id, input: { summary } });
      await fetchWorkItemDetails();
      setEditingSummary(false);
      onSuccess();
      toast({ title: "Success", description: "Task updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-4 bg-background flex flex-col gap-3 shrink-0 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded bg-blue-500 flex items-center justify-center">
            <Bookmark className="h-3 w-3 text-white" />
          </div>
          <span className="text-muted-foreground hover:underline cursor-pointer">Projects</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-muted-foreground">{workItem.key}</span>
        </div>

        <div className="flex items-center gap-1">
          {editingSummary && (
            <div className="flex items-center gap-2 mr-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Save
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon"><Lock className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon"><Eye className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon"><Share2 className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon"><Maximize2 className="h-4 w-4 text-muted-foreground" /></Button>
        </div>
      </div>

      {editingSummary ? (
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          autoFocus
          onBlur={handleSave}
          className="text-2xl font-semibold py-1 px-2 border-2 border-primary"
        />
      ) : (
        <h1
          className="text-2xl font-semibold tracking-tight cursor-pointer hover:bg-muted/50 py-1 px-2 rounded-md -ml-2 transition-colors border border-transparent"
          onClick={() => setEditingSummary(true)}
        >
          {summary}
        </h1>
      )}
    </div>
  );
}
