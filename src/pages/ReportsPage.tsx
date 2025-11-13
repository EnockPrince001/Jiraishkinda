import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_SPACE_DATA } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Space {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
}

export default function ReportsPage() {
  const { spaceKey } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!spaceKey) return;
      
      try {
        const client = getGraphQLClient(token || undefined);
        const spaceData: any = await client.request(GET_SPACE_DATA, { spaceKey });
        setSpace(spaceData.space);
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

  // Sample data for charts
  const burnupData = [
    { day: 'Day 1', completed: 5, total: 50 },
    { day: 'Day 2', completed: 12, total: 50 },
    { day: 'Day 3', completed: 18, total: 50 },
    { day: 'Day 4', completed: 25, total: 50 },
    { day: 'Day 5', completed: 32, total: 50 },
  ];

  const velocityData = [
    { sprint: 'Sprint 1', committed: 40, completed: 35 },
    { sprint: 'Sprint 2', committed: 45, completed: 42 },
    { sprint: 'Sprint 3', committed: 50, completed: 48 },
    { sprint: 'Sprint 4', committed: 48, completed: 45 },
  ];

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
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Track your team's progress and performance</p>
        </div>

        <Tabs defaultValue="burnup" className="space-y-4">
          <TabsList>
            <TabsTrigger value="burnup">Burnup Chart</TabsTrigger>
            <TabsTrigger value="velocity">Velocity Chart</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="burnup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Burnup Chart</CardTitle>
                <CardDescription>Track completed work vs. total scope</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={burnupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} name="Completed" />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" name="Total Scope" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
                <CardDescription>Story points committed vs. completed per sprint</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="committed" fill="hsl(var(--muted))" name="Committed" />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cumulative" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Flow Diagram</CardTitle>
                <CardDescription>Work item distribution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={burnupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
