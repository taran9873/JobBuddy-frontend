import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import NewApplicationPage from "./pages/NewApplicationPage";
import EditApplicationPage from "./pages/EditApplicationPage";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ApiExample from "./components/examples/ApiExample";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Outlet />;
};

// Root redirect component based on authentication status
const RootRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? (
    <Navigate to="/home" replace />
  ) : (
    <Navigate to="/auth" replace />
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirect based on auth status */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes */}
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications/new" element={<NewApplicationPage />} />
              <Route path="/applications/edit/:id" element={<EditApplicationPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/api-test" element={<ApiExample />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
