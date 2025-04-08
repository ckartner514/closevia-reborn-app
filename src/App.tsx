
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
