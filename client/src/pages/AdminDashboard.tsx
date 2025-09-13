import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, update, push, set } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import DepositRequests from '@/components/admin/DepositRequests';
import WithdrawRequests from '@/components/admin/WithdrawRequests';
import PendingMoney from '@/components/admin/PendingMoney';
import UsersManagement from '@/components/admin/UsersManagement';
import SupportTickets from '@/components/admin/SupportTickets';
import { useLocation } from 'wouter';

const AdminDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTickets: 0,
    totalRevenue: 0,
    pendingMoney: 0,
    totalOrders: 0
  });

  // Check if user is admin
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.email !== 'admin@monlyking.com') {
      navigate('/');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || currentUser.email !== 'admin@monlyking.com') return;

    const loadStats = async () => {
      try {
        // Load total users
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const totalUsers = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;

        // Load deposit requests
        const depositsRef = ref(database, 'depositRequests');
        const depositsSnapshot = await get(depositsRef);
        const totalDeposits = depositsSnapshot.exists() ? Object.keys(depositsSnapshot.val()).length : 0;

        // Load withdrawal requests
        const withdrawalsRef = ref(database, 'withdrawRequests');
        const withdrawalsSnapshot = await get(withdrawalsRef);
        const totalWithdrawals = withdrawalsSnapshot.exists() ? Object.keys(withdrawalsSnapshot.val()).length : 0;

        // Load pending tickets
        const ticketsRef = ref(database, 'supportTickets');
        const ticketsSnapshot = await get(ticketsRef);
        let pendingTickets = 0;
        if (ticketsSnapshot.exists()) {
          const tickets = ticketsSnapshot.val();
          pendingTickets = Object.values(tickets).filter((ticket: any) => ticket.status === 'pending').length;
        }

        // Calculate total revenue
        let totalRevenue = 0;
        if (depositsSnapshot.exists()) {
          const deposits = depositsSnapshot.val();
          Object.values(deposits).forEach((deposit: any) => {
            if (deposit.status === 'approved') {
              totalRevenue += deposit.amount || 0;
            }
          });
        }

        // Load orders and calculate pending money
        const ordersRef = ref(database, 'orders');
        const ordersSnapshot = await get(ordersRef);
        let totalOrders = 0;
        let pendingMoney = 0;
        
        if (ordersSnapshot.exists()) {
          const orders = ordersSnapshot.val();
          totalOrders = Object.keys(orders).length;
          
          // Calculate pending money (orders in escrow, delivering, awaiting confirmation)
          Object.values(orders).forEach((order: any) => {
            if (['escrow', 'delivering', 'awaiting_confirmation'].includes(order.status)) {
              pendingMoney += order.price || 0;
            }
          });
        }

        setStats({
          totalUsers,
          totalDeposits,
          totalWithdrawals,
          pendingTickets,
          totalRevenue,
          pendingMoney,
          totalOrders
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [currentUser]);

  if (!currentUser || currentUser.email !== 'admin@monlyking.com') {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl">
                <i className="fas fa-shield-alt text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-blue-200 text-lg">
                  Manage users, payments, and support requests
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-xs text-blue-200">Registered users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Deposit Requests</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-down text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalDeposits}</div>
                <p className="text-xs text-blue-200">Pending deposits</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Withdraw Requests</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-up text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalWithdrawals}</div>
                <p className="text-xs text-blue-200">Pending withdrawals</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Support Tickets</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-ticket-alt text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.pendingTickets}</div>
                <p className="text-xs text-blue-200">Pending tickets</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalRevenue.toFixed(0)} EGP</div>
                <p className="text-xs text-blue-200">From deposits</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Pending Money</CardTitle>
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-blue-300 text-lg"></i>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.pendingMoney.toFixed(0)} EGP</div>
                <p className="text-xs text-blue-200">In escrow orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="deposits" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <TabsTrigger 
                value="deposits" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <i className="fas fa-arrow-down mr-2"></i>
                Deposit Requests
              </TabsTrigger>
              <TabsTrigger 
                value="withdrawals"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <i className="fas fa-arrow-up mr-2"></i>
                Withdraw Requests
              </TabsTrigger>
              <TabsTrigger 
                value="pending-money"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <i className="fas fa-clock mr-2"></i>
                Pending Money
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <i className="fas fa-users mr-2"></i>
                Users Management
              </TabsTrigger>
              <TabsTrigger 
                value="support"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <i className="fas fa-ticket-alt mr-2"></i>
                Support Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm p-6">
                <DepositRequests />
              </div>
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm p-6">
                <WithdrawRequests />
              </div>
            </TabsContent>

            <TabsContent value="pending-money" className="mt-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm p-6">
                <PendingMoney />
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm p-6">
                <UsersManagement />
              </div>
            </TabsContent>

            <TabsContent value="support" className="mt-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm p-6">
                <SupportTickets />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
