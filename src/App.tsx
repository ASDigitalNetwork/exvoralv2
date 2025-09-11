import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { TranslationProvider } from "@/context/TranslationContext";
import { CurrencyProvider } from "@/hooks/useCurrency";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NewRequest from "@/pages/NewRequest";
import Invoices from "@/pages/Invoices";
import Profile from "@/pages/Profile";
import MyTransports from "@/pages/MyTransports";
import AvailableRequests from "@/pages/AvailableRequests";
import PartnerTransports from "@/pages/PartnerTransports";
import TrackingClient from "@/pages/TrackingClient";
import PartnerTracking from "@/pages/partner-tracking/[id]";
import NotFound from "@/pages/NotFound";
import EmailConfirmed from "@/pages/email-confirmed";
import SignupSuccess from "@/pages/signup-success";
import RequestsPage from "@/pages/client/requests/index";
import RequestDetailsPage from "@/pages/client/requests/[id]";
import PartnerInvoicePage from "@/pages/PartnerInvoices";
import AdminUsers from "@/pages/admin/users";
import AdminRequests from "@/pages/admin/requests";
import InvoicesPage from "@/pages/admin/invoices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TranslationProvider>
        <CurrencyProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-request" element={<NewRequest />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-transports" element={<MyTransports />} />
            <Route path="/available-requests" element={<AvailableRequests />} />
            <Route path="/client/requests" element={<RequestsPage />} />
            <Route path="/client/requests/:id" element={<RequestDetailsPage />} />
            <Route path="/partner-transports" element={<PartnerTransports />} />
            <Route path="/tracking" element={<TrackingClient />} />
            <Route path="/partner-tracking/:id" element={<PartnerTracking />} />
            <Route path="/email-confirmed" element={<EmailConfirmed />} />
            <Route path="/signup-success" element={<SignupSuccess />} />
            <Route path="/partner-invoices" element={<PartnerInvoicePage />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/invoices" element={<InvoicesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CurrencyProvider>
      </TranslationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
