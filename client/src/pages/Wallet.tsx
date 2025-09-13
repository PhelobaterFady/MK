import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { database, storage } from '../lib/firebase';
import { ref, push, uploadBytes, getDownloadURL, onValue, off } from 'firebase/database';
import { ref as storageRef, uploadBytes as uploadStorageBytes, getDownloadURL as getStorageDownloadURL } from 'firebase/storage';
import { formatCurrencySymbol } from '@/utils/currency';

const Wallet: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();
  const [depositForm, setDepositForm] = useState({
    amount: '',
    receiptImage: '',
    country: '',
    paymentMethod: '',
    instapayUser: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({
    withdrawAmount: '',
    afterFeeAmount: '',
    country: '',
    paymentMethod: '',
    instapayUser: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load wallet requests
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadWalletRequests = async () => {
      try {
        setLoadingRequests(true);
        
        // Load deposit requests
        const depositRef = ref(database, 'depositRequests');
        const withdrawRef = ref(database, 'withdrawRequests');
        
        const unsubscribeDeposits = onValue(depositRef, (snapshot) => {
          const deposits = snapshot.val() || {};
          const userDeposits = Object.entries(deposits)
            .filter(([_, deposit]: [string, any]) => deposit.userId === currentUser.uid)
            .map(([id, deposit]: [string, any]) => ({
              id,
              ...deposit,
              type: 'deposit'
            }));

          // Load withdraw requests
          const unsubscribeWithdraws = onValue(withdrawRef, (withdrawSnapshot) => {
            const withdraws = withdrawSnapshot.val() || {};
            const userWithdraws = Object.entries(withdraws)
              .filter(([_, withdraw]: [string, any]) => withdraw.userId === currentUser.uid)
              .map(([id, withdraw]: [string, any]) => ({
                id,
                ...withdraw,
                type: 'withdraw'
              }));

            // Combine and sort by date
            const allRequests = [...userDeposits, ...userWithdraws]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setWalletRequests(allRequests);
            setLoadingRequests(false);
          });

          return () => {
            off(depositRef, 'value', unsubscribeDeposits);
            off(withdrawRef, 'value', unsubscribeWithdraws);
          };
        });

        return () => {
          off(depositRef, 'value', unsubscribeDeposits);
        };
      } catch (error) {
        console.error('Error loading wallet requests:', error);
        setLoadingRequests(false);
      }
    };

    loadWalletRequests();
  }, [currentUser?.uid]);

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const calculateWithdrawAfterFee = (amount: number) => {
    return amount * 0.95; // 5% fee deducted
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved':
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const resetDepositForm = () => {
    setDepositForm({
      amount: '',
      receiptImage: '',
      country: '',
      paymentMethod: '',
      instapayUser: ''
    });
    setSelectedFile(null);
    const fileInput = document.getElementById('receiptImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawForm({
      withdrawAmount: '',
      afterFeeAmount: '',
      country: '',
      paymentMethod: '',
      instapayUser: ''
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `receipts/${currentUser?.uid}/${timestamp}_${file.name}`;
      
      // Upload to Firebase Storage
      const imageRef = storageRef(storage, filename);
      const snapshot = await uploadStorageBytes(imageRef, file);
      
      // Get download URL
      const downloadURL = await getStorageDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
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

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on payment method
    if (!depositForm.amount || !depositForm.country || !depositForm.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (depositForm.paymentMethod === 'instapay') {
      if (!depositForm.instapayUser || !selectedFile) {
        toast({
          title: "Error",
          description: "Please provide Instapay username and receipt image.",
          variant: "destructive"
        });
        return;
      }
    } else if (depositForm.paymentMethod === 'usdt') {
      if (!selectedFile) {
        toast({
          title: "Error",
          description: "Please upload receipt image.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Upload image first
      const imageUrl = await uploadImage(selectedFile);
      
      const depositRequest = {
        userId: currentUser?.uid,
        amount: parseFloat(depositForm.amount),
        receiptImage: imageUrl,
        country: depositForm.country,
        paymentMethod: depositForm.paymentMethod,
        instapayUser: depositForm.instapayUser || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const depositRef = ref(database, 'depositRequests');
      await push(depositRef, depositRequest);

      toast({
        title: "Success",
        description: "Deposit request submitted successfully! We'll review it within 24 hours.",
      });
      
      resetDepositForm();
    } catch (error) {
      console.error('Error submitting deposit request:', error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
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

    // Check minimum withdrawal amount
    if (amount < 500) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is 500 EGP. You cannot withdraw less than 500 EGP.",
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

    if (!withdrawForm.country || !withdrawForm.paymentMethod) {
      toast({
        title: "Error",
        description: "Please select country and payment method.",
        variant: "destructive"
      });
      return;
    }

    if (withdrawForm.paymentMethod === 'instapay' && !withdrawForm.instapayUser) {
      toast({
        title: "Error",
        description: "Please provide Instapay username.",
        variant: "destructive"
      });
      return;
    }

    try {
      const withdrawRequest = {
        userId: currentUser?.uid,
        amount: amount,
        country: withdrawForm.country,
        paymentMethod: withdrawForm.paymentMethod,
        instapayUser: withdrawForm.instapayUser || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const withdrawRef = ref(database, 'withdrawRequests');
      await push(withdrawRef, withdrawRequest);

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully! Processing time: 3-5 business days.",
      });
      
      resetWithdrawForm();
    } catch (error) {
      console.error('Error submitting withdraw request:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Wallet Management</h2>
          <p className="text-muted-foreground">Top-up your wallet or request withdrawals</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Deposit Request Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus text-green-400"></i>
                </div>
                <CardTitle>Deposit Request</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount to Deposit (EGP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100.00"
                    min="10"
                    step="0.01"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                    data-testid="deposit-amount-input"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={depositForm.country} 
                    onValueChange={(value) => setDepositForm(prev => ({ 
                      ...prev, 
                      country: value,
                      paymentMethod: '', // Reset payment method when country changes
                      instapayUser: '' // Reset instapay user when country changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="egypt">Egypt</SelectItem>
                      <SelectItem value="outside_egypt">Outside Egypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {depositForm.country && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={depositForm.paymentMethod} 
                      onValueChange={(value) => setDepositForm(prev => ({ 
                        ...prev, 
                        paymentMethod: value,
                        instapayUser: '' // Reset instapay user when payment method changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {depositForm.country === 'egypt' && (
                          <SelectItem value="instapay">Instapay</SelectItem>
                        )}
                        {depositForm.country === 'outside_egypt' && (
                          <SelectItem value="usdt">USDT</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {depositForm.paymentMethod === 'instapay' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="fas fa-info-circle text-blue-500"></i>
                      <span className="font-semibold text-blue-800">Instapay Details</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Transfer to: <span className="font-mono font-bold">andrew.hany.n@instapay</span>
                    </p>
                    <div>
                      <Label htmlFor="instapayUser">Your Instapay Username</Label>
                      <Input
                        id="instapayUser"
                        placeholder="Enter your Instapay username"
                        value={depositForm.instapayUser}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, instapayUser: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {depositForm.paymentMethod === 'usdt' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="fas fa-info-circle text-green-500"></i>
                      <span className="font-semibold text-green-800">USDT Details</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Transfer USDT to: <span className="font-mono font-bold">0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</span>
                    </p>
                  </div>
                )}


                <div>
                  <Label htmlFor="receiptImage">Receipt Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="receiptImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      data-testid="receipt-image-input"
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <i className="fas fa-check-circle"></i>
                        <span>Selected: {selectedFile.name}</span>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Uploading image...</span>
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <i className="fas fa-info-circle"></i>
                  <AlertDescription>
                    <strong>Deposit Process:</strong><br />
                    1. Transfer the amount to our account<br />
                    2. Upload receipt image (Max 5MB)<br />
                    3. We'll review and approve within 24 hours
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  data-testid="submit-deposit-button"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card mr-2"></i>
                      Submit Deposit Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdraw Request Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-minus text-red-400"></i>
                </div>
                <CardTitle>Withdraw Request</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <Label>Available Balance</Label>
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <span className="text-lg font-bold text-primary" data-testid="available-balance">
                      {formatCurrencySymbol(userProfile.walletBalance)}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="withdrawAmount">Withdrawal Amount (EGP)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="500.00"
                    min="500"
                    max={userProfile.walletBalance}
                    step="0.01"
                    value={withdrawForm.withdrawAmount}
                    onChange={handleWithdrawAmountChange}
                    data-testid="withdraw-amount-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum withdrawal amount is 500 EGP
                  </p>
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
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={withdrawForm.country} 
                    onValueChange={(value) => setWithdrawForm(prev => ({ 
                      ...prev, 
                      country: value,
                      paymentMethod: '', // Reset payment method when country changes
                      instapayUser: '' // Reset instapay user when country changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="egypt">Egypt</SelectItem>
                      <SelectItem value="outside_egypt">Outside Egypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {withdrawForm.country && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={withdrawForm.paymentMethod} 
                      onValueChange={(value) => setWithdrawForm(prev => ({ 
                        ...prev, 
                        paymentMethod: value,
                        instapayUser: '' // Reset instapay user when payment method changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {withdrawForm.country === 'egypt' && (
                          <SelectItem value="instapay">Instapay</SelectItem>
                        )}
                        {withdrawForm.country === 'outside_egypt' && (
                          <SelectItem value="usdt">USDT</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {withdrawForm.paymentMethod === 'instapay' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="fas fa-info-circle text-blue-500"></i>
                      <span className="font-semibold text-blue-800">Instapay Details</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      We will transfer to your Instapay account
                    </p>
                    <div>
                      <Label htmlFor="instapayUser">Your Instapay Username</Label>
                      <Input
                        id="instapayUser"
                        placeholder="Enter your Instapay username"
                        value={withdrawForm.instapayUser}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, instapayUser: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {withdrawForm.paymentMethod === 'usdt' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="fas fa-info-circle text-green-500"></i>
                      <span className="font-semibold text-green-800">USDT Details</span>
                    </div>
                    <p className="text-sm text-green-700">
                      We will transfer USDT to your wallet address
                    </p>
                  </div>
                )}


                <Alert className="border-yellow-500/20 bg-yellow-500/10">
                  <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                  <AlertDescription>
                    <strong className="text-yellow-400">Withdrawal Fee: 5%</strong><br />
                    Processing time: 3-5 business days. Minimum withdrawal: 500 EGP
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

        {/* My Wallet Requests */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-history text-blue-400"></i>
                </div>
                <CardTitle>My Wallet Requests</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : walletRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-inbox text-4xl mb-4"></i>
                  <p>No wallet requests found</p>
                  <p className="text-sm">Your deposit and withdrawal requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            request.type === 'deposit' 
                              ? 'bg-green-500/20' 
                              : 'bg-red-500/20'
                          }`}>
                            <i className={`fas ${
                              request.type === 'deposit' 
                                ? 'fa-plus text-green-400' 
                                : 'fa-minus text-red-400'
                            }`}></i>
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {request.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Request ID: #{request.id.slice(-8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-3">
                            <span className={`text-lg font-bold ${
                              request.type === 'deposit' 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {request.type === 'deposit' ? '+' : '-'}{formatCurrencySymbol(request.amount)}
                            </span>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                          {request.type === 'withdraw' && (
                            <p className="text-sm text-muted-foreground mt-1">
                              After fee: {formatCurrencySymbol(request.amount * 0.95)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Additional details */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Country:</span>
                            <p className="font-medium">
                              {request.country === 'egypt' ? 'Egypt' : 'Outside Egypt'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment Method:</span>
                            <p className="font-medium">
                              {request.paymentMethod === 'instapay' ? 'Instapay' : 
                               request.paymentMethod === 'usdt' ? 'USDT' : 
                               request.paymentMethod || 'N/A'}
                            </p>
                          </div>
                          {request.instapayUser && (
                            <div>
                              <span className="text-muted-foreground">Instapay Username:</span>
                              <p className="font-medium">{request.instapayUser}</p>
                            </div>
                          )}
                          {request.receiptImage && (
                            <div>
                              <span className="text-muted-foreground">Receipt:</span>
                              <a 
                                href={request.receiptImage} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 ml-2"
                              >
                                <i className="fas fa-external-link-alt mr-1"></i>
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {/* Admin notes if available */}
                        {request.adminNotes && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground text-sm">Admin Notes:</span>
                            <p className="text-sm mt-1">{request.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Wallet;
