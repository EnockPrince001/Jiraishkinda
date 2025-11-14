import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_ME } from "@/lib/queries";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserSpaces = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const client = getGraphQLClient(token);
        const data: any = await client.request(GET_ME);
        const userSpaces = data.getMe.spaces || [];
        
        if (userSpaces.length > 0) {
          // Redirect to first space's board
          navigate(`/spaces/${userSpaces[0].space.key}/board`, { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch user spaces:", error);
        setLoading(false);
      }
    };

    fetchUserSpaces();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // This shouldn't be reached if user has spaces since useEffect redirects
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Welcome to WorkNest</h1>
          <p className="text-xl text-muted-foreground">
            Get started by creating your first space
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <button
            onClick={() => navigate('/create-space')}
            className="p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Create Space</h3>
                <p className="text-sm text-muted-foreground">
                  Start a new project workspace
                </p>
              </div>
            </div>
          </button>

          <div className="p-8 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Documentation</li>
              <li>• Templates</li>
              <li>• Support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
