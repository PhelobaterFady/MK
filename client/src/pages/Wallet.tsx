import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Wallet: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [topupForm, setTopupForm] = useState({
    walletName: '',
    amountPaid: '',
    creditAmount: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({
    withdrawAmount: '',
    afterFeeAmount: '',
    withdrawMethod: '',
    accountDetails: ''
  });

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const calculateTopupCredit = (amountPaid: number) => {
    return amountPaid * 0.95; // 5% fee deducted
  };

  const calculateWithdrawAfterFee = (amount: number) => {
    return amount * 0.95; // 5% fee deducted
  };

  const handleTopupAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amountPaid = parseFloat(e.target.value) || 0;
    const creditAmount = calculateTopupCredit(amountPaid);
    
    setTopupForm(prev => ({
      ...prev,
      amountPaid: e.target.value,
      creditAmount: creditAmount.toFixed(2)
    }));
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const withdrawAmount = parseFloat(e.target.value) || 0;
    const afterFeeAmount = calculateWithdrawAfterFee(withdrawAmount);
    
    setWithdrawForm(prev => ({
      ...prev,
      withdrawAmount: e.target.value,
      afterFeeAmount: afterFeeAmount.toFixed(2)
    }));
  };

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupForm.walletName || !topupForm.amountPaid) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Submit to Firebase
    toast({
      title: "Success",
      description: "Top-up request submitted successfully! We'll review it within 24 hours.",
    });
    
    setTopupForm({
      walletName: '',
      amountPaid: '',
      creditAmount: ''
    });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawForm.withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    if (amount > userProfile.walletBalance) {
      toast({
        title: "Error",
        description: "Insufficient wallet balance.",
        variant: "destructive"
      });
      return;
    }

    if (!withdrawForm.withdrawMethod || !withdrawForm.accountDetails) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Submit to Firebase
    toast({
      title: "Success",
      description: "Withdrawal request submitted successfully! Processing time: 3-5 business days.",
    });
    
    setWithdrawForm({
      withdrawAmount: '',
      afterFeeAmount: '',
      withdrawMethod: '',
      accountDetails: ''
    });
  };

  // Mock transaction data
  const transactions = [
    {
      id: '1',
      type: 'topup',
      description: 'Wallet Top-up',
      amount: 500.00,
      status: 'completed',
      date: '2024-12-10T15:24:00Z'
    },
    {
      id: '2',
      type: 'purchase',
      description: 'FIFA Account Purchase',
      amount: -299.00,
      status: 'completed',
      date: '2024-12-08T13:15:00Z'
    },
    {
      id: '3',
      type: 'withdraw',
      description: 'Withdrawal Request',
      amount: -200.00,
      status: 'pending',
      date: '2024-12-05T09:42:00Z'
    }
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Wallet Management</h2>
          <p className="text-muted-foreground">Top-up your wallet or request withdrawals</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top-up Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus text-green-400"></i>
                </div>
                <CardTitle>Top-up Wallet</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTopupSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="walletName">Wallet/Account Name</Label>
                  <Input
                    id="walletName"
                    placeholder="Your wallet or account name"
                    value={topupForm.walletName}
                    onChange={(e) => setTopupForm(prev => ({ ...prev, walletName: e.target.value }))}
                    data-testid="wallet-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="amountPaid">Amount You Paid ($)</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    placeholder="1050.00"
                    min="10"
                    step="0.01"
                    value={topupForm.amountPaid}
                    onChange={handleTopupAmountChange}
                    data-testid="amount-paid-input"
                  />
                </div>

                <div>
                  <Label htmlFor="creditAmount">Amount to Credit (After 5% Fee)</Label>
                  <Input
                    id="creditAmount"
                    placeholder="1000.00"
                    value={topupForm.creditAmount}
                    readOnly
                    className="bg-muted"
                    data-testid="credit-amount-display"
                  />
                </div>

                <Alert>
                  <i className="fas fa-info-circle"></i>
                  <AlertDescription>
                    <strong>Processing Fee: 5%</strong><br />
                    A 5% processing fee applies to all top-ups. Your request will be reviewed by our team within 24 hours.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  data-testid="submit-topup-button"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Submit Top-up Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdraw Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-minus text-red-400"></i>
                </div>
                <CardTitle>Withdraw Funds</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <Label>Available Balance</Label>
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <span className="text-lg font-bold text-primary" data-testid="available-balance">
                      ${userProfile.walletBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="withdrawAmount">Withdrawal Amount ($)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="500.00"
                    min="10"
                    max={userProfile.walletBalance}
                    step="0.01"
                    value={withdrawForm.withdrawAmount}
                    onChange={handleWithdrawAmountChange}
                    data-testid="withdraw-amount-input"
                  />
                </div>

                <div>
                  <Label htmlFor="afterFeeAmount">Amount After Fee (5% deducted)</Label>
                  <Input
                    id="afterFeeAmount"
                    placeholder="475.00"
                    value={withdrawForm.afterFeeAmount}
                    readOnly
                    className="bg-muted"
                    data-testid="after-fee-amount-display"
                  />
                </div>

                <div>
                  <Label htmlFor="withdrawMethod">Withdrawal Method</Label>
                  <Select 
                    value={withdrawForm.withdrawMethod} 
                    onValueChange={(value) => setWithdrawForm(prev => ({ ...prev, withdrawMethod: value }))}
                  >
                    <SelectTrigger data-testid="withdraw-method-select">
                      <SelectValue placeholder="Select withdrawal method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accountDetails">Account Details</Label>
                  <Textarea
                    id="accountDetails"
                    placeholder="Enter your account details (email, account number, etc.)"
                    value={withdrawForm.accountDetails}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountDetails: e.target.value }))}
                    className="h-24"
                    data-testid="account-details-textarea"
                  />
                </div>

                <Alert className="border-yellow-500/20 bg-yellow-500/10">
                  <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                  <AlertDescription>
                    <strong className="text-yellow-400">Withdrawal Fee: 5%</strong><br />
                    Processing time: 3-5 business days. Minimum withdrawal: $10.00
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  data-testid="submit-withdraw-button"
                >
                  <i className="fas fa-money-bill-wave mr-2"></i>
                  Submit Withdrawal Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount > 0;
                  const getIcon = () => {
                    switch (transaction.type) {
                      case 'topup': return 'fa-plus text-green-400';
                      case 'purchase': return 'fa-shopping-cart text-red-400';
                      case 'withdraw': return 'fa-clock text-yellow-400';
                      default: return 'fa-exchange-alt text-primary';
                    }
                  };

                  return (
                    <div 
                      key={transaction.id} 
                      className="py-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <i className={`fas ${getIcon()}`}></i>
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span 
                          className={`text-lg font-bold ${
                            isPositive ? 'text-green-400' : 'text-red-400'
                          }`}
                          data-testid={`transaction-amount-${transaction.id}`}
                        >
                          {isPositive ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                        <p className="text-sm text-muted-foreground capitalize">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
