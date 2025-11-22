import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CreateWorkItemDialog } from "@/components/CreateWorkItemDialog";
import { EditWorkItemDialog } from "@/components/EditWorkItemDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
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
  storyPoints?: number;
  assignee?: { id: string; userName: string };
  reporter: { id: string; userName: string };
  createdDate: string;
}

export default function ListPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!spaceKey) return;

    try {
      setLoading(true);
      const client = getGraphQLClient(token || undefined);

      const [spaceData, workItemsData]: any = await Promise.all([
        client.request(GET_SPACE_DATA, { spaceKey }),
        client.request(GET_WORK_ITEMS, { spaceKey }),
      ]);

      setSpace(spaceData.space?.[0] || null);
      setWorkItems(workItemsData.workItemsForSpace || []);
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

  useEffect(() => {
    fetchData();
  }, [spaceKey, token]);

  const filteredWorkItems = workItems.filter((item) => {
    const matchesSearch = item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'default';
      case 'IN PROGRESS':
        return 'secondary';
      case 'TO DO':
        return 'outline';
      default:
        return 'outline';
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Work Items</h1>
          <CreateWorkItemDialog spaceId={space.id} onSuccess={fetchData} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TO DO">To Do</SelectItem>
              <SelectItem value="IN PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead className="text-right">Story Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No work items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedWorkItemId(item.id)}
                  >
                    <TableCell className="font-medium">{item.key}</TableCell>
                    <TableCell>{item.summary}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    </TableCell>
                    <TableCell>{item.assignee?.userName || 'Unassigned'}</TableCell>
                    <TableCell>{item.reporter.userName}</TableCell>
                    <TableCell className="text-right">{item.storyPoints || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditWorkItemDialog
        workItemId={selectedWorkItemId}
        open={!!selectedWorkItemId}
        onOpenChange={(open) => !open && setSelectedWorkItemId(null)}
        onSuccess={fetchData}
      />
    </MainLayout>
  );
}
