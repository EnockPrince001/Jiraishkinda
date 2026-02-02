import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Standardized all page imports to use the "@/" alias
import Index from "@/pages/Index";
import CreateSpacePage from "@/pages/CreateSpacePage";
import BoardPage from "@/pages/BoardPage";
import ListPage from "@/pages/ListPage";
import BacklogPage from "@/pages/BacklogPage";
import ReportsPage from "@/pages/ReportsPage";
import TimelinePage from "@/pages/TimelinePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/NotFound";
import ManageSpacesPage from "@/pages/ManageSpacesPage";
import SpaceSettingsLayout from "@/pages/SpaceSettingsLayout";
import SpaceDetailsPage from "@/pages/SpaceDetailsPage";
import SpaceAccessPage from "@/pages/SpaceAccessPage";
import AccountSettingsLayout from "@/pages/settings/AccountSettingsLayout";
import ProfileSettingsPage from "@/pages/settings/ProfileSettingsPage";
import SecuritySettingsPage from "@/pages/settings/SecuritySettingsPage";
import AccountNotificationsPage from "@/pages/settings/AccountNotificationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
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

              {/* Manage Spaces */}
              <Route
                path="/settings/spaces"
                element={
                  <ProtectedRoute>
                    <ManageSpacesPage />
                  </ProtectedRoute>
                }
              />

              {/* Space settings */}
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

              {/* Account settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AccountSettingsLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSettingsPage />} />
                <Route path="security" element={<SecuritySettingsPage />} />
                <Route path="notifications" element={<AccountNotificationsPage />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;