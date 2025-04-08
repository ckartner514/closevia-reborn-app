
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ContactsPage from "./pages/Contacts";
import CreateProposal from "./pages/CreateProposal";
import ProposalsPage from "./pages/Proposals";
import InvoicesPage from "./pages/Invoices";
import PaymentsPage from "./pages/Payments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Configure the React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [supabaseConnected, setSupabaseConnected] = useState(true);

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        await supabase.from('_test_connection').select('*').limit(1);
        setSupabaseConnected(true);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setSupabaseConnected(false);
      }
    };

    testConnection();
  }, []);

  if (!supabaseConnected) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle className="text-lg">Supabase Connection Error</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              We couldn't connect to your Supabase project. Please make sure it's properly connected:
            </p>
            <ol className="mt-4 list-decimal pl-6 space-y-2">
              <li>Click on the green Supabase button in the top right corner</li>
              <li>Connect your project or create a new one</li>
              <li>Refresh this page after connecting</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RoleProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected Routes (with Layout) */}
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/contacts" element={<AppLayout><ContactsPage /></AppLayout>} />
                <Route path="/create" element={<AppLayout><CreateProposal /></AppLayout>} />
                <Route path="/proposals" element={<AppLayout><ProposalsPage /></AppLayout>} />
                <Route path="/invoices" element={<AppLayout><InvoicesPage /></AppLayout>} />
                <Route path="/payments" element={<AppLayout><PaymentsPage /></AppLayout>} />
                <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
                
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
