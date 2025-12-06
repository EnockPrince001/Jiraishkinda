import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import CreateSpacePage from "./pages/CreateSpacePage";
import BoardPage from "./pages/BoardPage";
import ListPage from "./pages/ListPage";
import BacklogPage from "./pages/BacklogPage";
import ReportsPage from "./pages/ReportsPage";
import TimelinePage from "./pages/TimelinePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import ManageSpacesPage from "./pages/ManageSpacesPage";
import SpaceSettingsLayout from "./pages/SpaceSettingsLayout";
import SpaceDetailsPage from "./pages/SpaceDetailsPage";
import SpaceAccessPage from "./pages/SpaceAccessPage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-space"
                element={
                  <ProtectedRoute>
                    <CreateSpacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/board"
                element={
                  <ProtectedRoute>
                    <BoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/list"
                element={
                  <ProtectedRoute>
                    <ListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/backlog"
                element={
                  <ProtectedRoute>
                    <BacklogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/timeline"
                element={
                  <ProtectedRoute>
                    <TimelinePage />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="/settings/spaces"
                element={
                  <ProtectedRoute>
                    <ManageSpacesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:spaceKey/settings"
                element={
                  <ProtectedRoute>
                    <SpaceSettingsLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="details" replace />} />
                <Route path="details" element={<SpaceDetailsPage />} />
                <Route path="access" element={<SpaceAccessPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
