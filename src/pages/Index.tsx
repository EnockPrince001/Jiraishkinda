import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_ME } from "@/lib/queries";

interface Space {
  id: string;
  name: string;
  key: string;
  type: string;
}

interface UserSpace {
  role: string;
  space: Space;
}

const Index = () => {
  const [spaces, setSpaces] = useState<UserSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const client = getGraphQLClient(token || undefined);
        const data: any = await client.request(GET_ME);
        setSpaces(data.getMe.spaces || []);
      } catch (error) {
        console.error('Failed to fetch spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [token]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (spaces.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-8">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Worknest</h1>
              <p className="text-muted-foreground text-lg">
                Get started by creating your first space or wait for an invitation
              </p>
            </div>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Create your first space</CardTitle>
                <CardDescription>
                  Spaces help you organize work and collaborate with your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="lg" className="w-full gap-2" onClick={() => navigate('/create-space')}>
                  <Plus className="h-5 w-5" />
                  Create Space
                </Button>
              </CardContent>
            </Card>

            <div className="pt-8 space-y-4">
              <p className="text-sm text-muted-foreground">
                Or explore these helpful resources:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Documentation</CardTitle>
                    <CardDescription className="text-sm">
                      Learn how to use Worknest
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Templates</CardTitle>
                    <CardDescription className="text-sm">
                      Start with pre-built templates
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Support</CardTitle>
                    <CardDescription className="text-sm">
                      Get help from our team
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If user has spaces, navigate to first space
  useEffect(() => {
    if (spaces.length > 0) {
      navigate(`/spaces/${spaces[0].space.key}/board`);
    }
  }, [spaces, navigate]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Redirecting...</div>
      </div>
    </MainLayout>
  );
};

export default Index;
