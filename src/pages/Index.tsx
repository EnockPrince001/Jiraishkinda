// src/pages/Index.tsx
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { GET_ME } from "@/lib/queries";

// Define types for the fetched data if not already defined globally
interface SpaceDetails {
  id: string;
  name: string;
  key: string;
  type: 'SCRUM' | 'KANBAN';
}

interface UserSpace {
  role: string;
  space: SpaceDetails;
}

interface meResponse {
  me: {
    id: string;
    userName: string;
    email: string;
    spaces: UserSpace[];
  };
}


const Index = () => {
  // State to track if the initial check (auth + spaces) is complete
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  // State to track if the user has spaces (after auth is confirmed)
  const [hasSpaces, setHasSpaces] = useState<boolean | null>(null); // null means not checked yet
  const { token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserSpaces = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // If not authenticated, the ProtectedRoute should handle redirection to /login
      // This check is just a safeguard if somehow this runs while unauthenticated after authLoading
      if (!token) {
         // If token is missing after auth loading, force logout or redirect
         // Assuming ProtectedRoute handles this, but adding check for clarity
         console.warn("Index.tsx: Token missing after auth loading.");
         // Potential fallback: navigate('/login'); // Uncomment if needed
         setInitialCheckComplete(true); // Stop loading state even if auth failed unexpectedly
         setHasSpaces(false); // Assume no spaces if not authenticated
         return;
      }

      try {
        const client = getGraphQLClient(token);
        const data: meResponse = await client.request(GET_ME);
const userSpaces = data.me?.[0]?.spaces || [];
        if (userSpaces.length > 0) {
          // User has spaces, redirect to the most recent one's board
          setHasSpaces(true); // Mark that spaces were found
          // Redirect happens *before* rendering the main content
          navigate(`/spaces/${userSpaces[0].space.key}/board`, { replace: true });
          // Do NOT set initialCheckComplete here because navigate will change the component
          // The Index component will unmount after navigation.
          return; // Exit early, no need to set other states
        } else {
          // User is authenticated but has no spaces
          setHasSpaces(false);
        }
      } catch (error) {
        console.error("Failed to fetch user spaces:", error);
        // Decide on error handling: navigate to error page, show message, or default to no spaces?
        // For now, defaulting to no spaces seems reasonable to allow creating one.
        setHasSpaces(false);
      } finally {
        // Mark that the initial check (auth + space fetch attempt) is complete
        // This ensures the loading state ends and the correct content (create or redirect) is shown
        setInitialCheckComplete(true);
      }
    };

    // Only run the effect if auth loading is complete
    if (!authLoading) {
      fetchUserSpaces();
    }
  }, [token, authLoading, navigate]); // Run when token or authLoading changes

  // Show loading state while checking authentication and spaces
  if (!initialCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If initial check is complete and user has spaces, they should have been redirected by now.
  // If they are still on Index, something unexpected happened (e.g., redirect failed).
  // However, given the `navigate` call above with { replace: true }, this render block
  // should ideally only execute if `hasSpaces` was determined to be false.
  if (hasSpaces === false) {
    // This block renders only if the user is authenticated and confirmed to have NO spaces.
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
  }

  // If initial check is complete and hasSpaces is true, the user should have been redirected.
  // This part might not be reached under normal circumstances due to the navigate() call,
  // but it's good practice to handle it if the redirect somehow fails or is delayed.
  // Potentially show a message or trigger the redirect again if needed.
  // For now, just render a fallback loading or error state if this unlikely scenario occurs.
  if (hasSpaces === true) {
     console.warn("Index.tsx: User confirmed to have spaces but was not redirected. This should not happen.");
     // Potentially trigger navigate again or show an error message
     // navigate(`/spaces/${someFetchedSpaceKey}/board`, { replace: true }); // Needs the key somehow if this runs
     // Or render a message:
     return (
       <div className="flex items-center justify-center min-h-screen bg-background">
         <div className="text-lg">Redirecting to your space...</div>
       </div>
     );
  }

  // Fallback for type safety if hasSpaces is somehow still null after initialCheckComplete
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-lg">Something went wrong.</div>
    </div>
  );
};

export default Index;