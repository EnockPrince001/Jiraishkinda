import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
}

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee?: { id: string; userName: string };
  updatedDate: string;
}

export default function TimelinePage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!spaceKey) return;
      
      try {
        const client = getGraphQLClient(token || undefined);
        
        const [spaceData, workItemsData]: any = await Promise.all([
          client.request(GET_SPACE_DATA, { spaceKey }),
          client.request(GET_WORK_ITEMS, { spaceKey }),
        ]);

        setSpace(spaceData.space?.[0] || null);
        // Filter only completed items and sort by update date
        const completedItems = (workItemsData.workItemsForSpace || [])
          .filter((item: WorkItem) => item.status === 'DONE')
          .sort((a: WorkItem, b: WorkItem) => 
            new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
          );
        setWorkItems(completedItems);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [spaceKey, token, toast]);

  if (loading) {
    return (
      <MainLayout spaceName={space?.name} spaceType={space?.type}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!space) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Space not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout spaceName={space.name} spaceType={space.type}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-muted-foreground">Recently completed work items</p>
        </div>

        <div className="space-y-4">
          {workItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed items yet</p>
              </CardContent>
            </Card>
          ) : (
            workItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-muted-foreground">{item.key}</span>
                          <Badge variant="outline">{item.priority}</Badge>
                        </div>
                        <p className="font-medium">{item.summary}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Completed {new Date(item.updatedDate).toLocaleDateString()}</span>
                          {item.assignee && (
                            <>
                              <span>•</span>
                              <span>{item.assignee.userName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
