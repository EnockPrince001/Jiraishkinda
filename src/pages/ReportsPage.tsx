import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA, GET_WORK_ITEMS } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  priority: string;
  type?: string;
  storyPoints?: number;
  sprintId?: string;
  boardColumnId: string;
  createdDate: string;
  updatedDate: string;
}

interface BoardColumn {
  id: string;
  name: string;
  order: number;
  isSystem?: boolean;
}

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
  sprints: Sprint[];
  boardColumns: BoardColumn[];
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
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

    fetchData();
  }, [spaceKey, token, toast]);

  // ─── Derived Data ───────────────────────────────────────────────

  // Last column = "Done"
  const lastColumnId = space?.boardColumns?.sort((a, b) => b.order - a.order)[0]?.id;

  // 1. VELOCITY — story points per sprint
  const velocityData = (space?.sprints || [])
    .filter(s => s.status === 'COMPLETED' || s.status === 'ACTIVE')
    .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime())
    .map(sprint => {
      const sprintItems = workItems.filter(wi => wi.sprintId === sprint.id);
      const committed = sprintItems.reduce((sum, wi) => sum + (wi.storyPoints || 0), 0);
      const completed = sprintItems
        .filter(wi => wi.boardColumnId === lastColumnId)
        .reduce((sum, wi) => sum + (wi.storyPoints || 0), 0);
      return { sprint: sprint.name, committed, completed };
    });

  // 2. TYPE BREAKDOWN — pie chart
  const typeCounts: Record<string, number> = {};
  workItems.forEach(wi => {
    const t = wi.type || 'TASK';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // 3. PRIORITY BREAKDOWN — bar chart
  const priorityCounts: Record<string, number> = {};
  workItems.forEach(wi => {
    priorityCounts[wi.priority] = (priorityCounts[wi.priority] || 0) + 1;
  });
  const priorityData = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => ({
    priority: p,
    count: priorityCounts[p] || 0,
  }));

  // 4. BOARD FLOW — items and points per column
  const cumulativeData = (space?.boardColumns || [])
    .sort((a, b) => a.order - b.order)
    .map(col => ({
      column: col.name,
      items: workItems.filter(wi => wi.boardColumnId === col.id).length,
      points: workItems
        .filter(wi => wi.boardColumnId === col.id)
        .reduce((sum, wi) => sum + (wi.storyPoints || 0), 0),
    }));

  // 5. ACTIVE SPRINT SUMMARY
  const activeSprint = space?.sprints?.find(s => s.status === 'ACTIVE');
  const activeSprintItems = activeSprint
    ? workItems.filter(wi => wi.sprintId === activeSprint.id)
    : [];
  const doneItems = activeSprintItems.filter(wi => wi.boardColumnId === lastColumnId);
  const totalPoints = activeSprintItems.reduce((sum, wi) => sum + (wi.storyPoints || 0), 0);
  const donePoints = doneItems.reduce((sum, wi) => sum + (wi.storyPoints || 0), 0);
  const completionPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  if (loading) {
    return (
      <MainLayout spaceName={space?.name} spaceType={space?.type} spaceId={space?.id}>
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
    <MainLayout spaceName={space.name} spaceType={space.type} spaceId={space.id}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Track your team's progress and performance</p>
        </div>

        {/* ── ACTIVE SPRINT SUMMARY CARDS ── */}
        {activeSprint && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Sprint</CardDescription>
                <CardTitle className="text-lg truncate">{activeSprint.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>Active</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Items</CardDescription>
                <CardTitle className="text-3xl">{activeSprintItems.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{doneItems.length} completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Story Points</CardDescription>
                <CardTitle className="text-3xl">{donePoints} / {totalPoints}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">completed / committed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completion</CardDescription>
                <CardTitle className="text-3xl">{completionPct}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="velocity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="cumulative">Board Flow</TabsTrigger>
            <TabsTrigger value="types">Item Types</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
          </TabsList>

          {/* ── VELOCITY ── */}
          <TabsContent value="velocity">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Velocity</CardTitle>
                <CardDescription>Story points committed vs. completed per sprint</CardDescription>
              </CardHeader>
              <CardContent>
                {velocityData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No sprint data yet. Start and complete a sprint to see velocity.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sprint" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="committed" fill="#6366f1" name="Committed Points" />
                      <Bar dataKey="completed" fill="#22c55e" name="Completed Points" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BOARD FLOW ── */}
          <TabsContent value="cumulative">
            <Card>
              <CardHeader>
                <CardTitle>Board Flow</CardTitle>
                <CardDescription>Work items and story points per board column</CardDescription>
              </CardHeader>
              <CardContent>
                {cumulativeData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No board columns found.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="column" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="items" fill="#6366f1" name="Items" />
                      <Bar yAxisId="right" dataKey="points" fill="#f59e0b" name="Story Points" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TYPE BREAKDOWN ── */}
          <TabsContent value="types">
            <Card>
              <CardHeader>
                <CardTitle>Work Item Types</CardTitle>
                <CardDescription>Distribution of tasks, bugs, stories, and epics</CardDescription>
              </CardHeader>
              <CardContent>
                {typeData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No work items found.
                  </div>
                ) : (
                  <div className="flex items-center gap-8 flex-wrap">
                    <ResponsiveContainer width="50%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {typeData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {typeData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{entry.name}</span>
                          <span className="text-sm text-muted-foreground">({entry.value} items)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRIORITY ── */}
          <TabsContent value="priority">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Work items by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Items">
                      {priorityData.map((entry) => (
                        <Cell
                          key={entry.priority}
                          fill={
                            entry.priority === 'URGENT' ? '#ef4444' :
                            entry.priority === 'HIGH' ? '#f59e0b' :
                            entry.priority === 'MEDIUM' ? '#6366f1' :
                            '#22c55e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}