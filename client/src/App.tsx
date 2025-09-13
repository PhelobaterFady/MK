import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Marketplace from "@/pages/Marketplace";
import Dashboard from "@/pages/Dashboard";
import Wallet from "@/pages/Wallet";
import Support from "@/pages/Support";
import Chat from "@/pages/Chat";
import Admin from "@/pages/Admin";
import AdminDashboard from "@/pages/AdminDashboard";
import AccountDetails from "@/pages/AccountDetails";
import SellAccount from "@/pages/SellAccount";
import SellingDashboard from "@/pages/SellingDashboard";
import ProductChat from "@/pages/ProductChat";
import UserProfile from "@/pages/UserProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/account/:id" component={AccountDetails} />
      <Route path="/chat/:accountId" component={ProductChat} />
      <Route path="/profile/:userId" component={UserProfile} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/wallet">
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      </Route>
      
      <Route path="/support">
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      </Route>
      
      <Route path="/chat">
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      </Route>
      
      <Route path="/sell">
        <ProtectedRoute>
          <SellAccount />
        </ProtectedRoute>
      </Route>
      
      <Route path="/selling-dashboard">
        <ProtectedRoute>
          <SellingDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Only Routes */}
      <Route path="/admin">
        <ProtectedRoute adminOnly>
          <Admin />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin-dashboard">
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Layout>
              <Toaster />
              <Router />
            </Layout>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
