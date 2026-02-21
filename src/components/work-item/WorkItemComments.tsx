import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkItemDetailsType } from "../EditWorkItemDialog";
import { getGraphQLClient } from "@/lib/graphql-client";
import { ADD_COMMENT } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface WorkItemCommentsProps {
  workItem: WorkItemDetailsType;
  fetchWorkItemDetails: () => Promise<void>;
}

export function WorkItemComments({ workItem, fetchWorkItemDetails }: WorkItemCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { token } = useAuth();
  const { toast } = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(ADD_COMMENT, { workItemId: workItem.id, content: newComment.trim() });
      setNewComment("");
      await fetchWorkItemDetails();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-4">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-slate-600 text-white text-[10px]">ME</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[40px]"
          />
          {newComment && <Button size="sm" onClick={handleAddComment}>Save</Button>}
        </div>
      </div>

      {workItem.comments?.map((c) => (
        <div key={c.id} className="flex gap-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 text-slate-700 text-[10px]">{c.author?.userName?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{c.author?.userName}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdDate), { addSuffix: true })}</span>
            </div>
            <div className="text-sm text-slate-700">{c.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
