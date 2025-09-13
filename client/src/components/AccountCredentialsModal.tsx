import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface AccountCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    id: string;
    gameAccountTitle: string;
    price: number;
    status: string;
    accountDetails?: {
      username?: string;
      password?: string;
      email?: string;
      recoveryEmail?: string;
      phoneNumber?: string;
      securityQuestions?: string;
      twoFactorAuth?: string;
      additionalInfo?: string;
    };
  } | null;
}

const AccountCredentialsModal: React.FC<AccountCredentialsModalProps> = ({ 
  isOpen, 
  onClose, 
  orderData 
}) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid';
      case 'delivering':
        return 'Delivering';
      case 'delivered':
        return 'Delivered';
      case 'awaiting_confirmation':
        return 'Awaiting Confirmation';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'paid':
        return 'bg-blue-500 text-white';
      case 'delivering':
        return 'bg-purple-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'awaiting_confirmation':
        return 'bg-orange-500 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'refunded':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!isOpen || !orderData) return null;

  console.log('=== ACCOUNT CREDENTIALS MODAL ===');
  console.log('orderData received:', orderData);
  console.log('accountDetails:', orderData.accountDetails);

  const credentials = orderData.accountDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-5xl max-h-[90vh] mx-4 shadow-2xl border-0 bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-key text-white"></i>
            </div>
            <span>Account Credentials - {orderData.gameAccountTitle}</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <i className="fas fa-times text-lg"></i>
          </Button>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {/* Order Info */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-800 flex items-center space-x-2">
                    <i className="fas fa-info-circle text-blue-600"></i>
                    <span>Order Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="fas fa-hashtag text-blue-600"></i>
                        <strong className="text-blue-800">Order ID</strong>
                      </div>
                      <p className="text-sm text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">#{orderData.id}</p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="fas fa-dollar-sign text-green-600"></i>
                        <strong className="text-blue-800">Price</strong>
                      </div>
                      <p className="text-lg font-bold text-green-700">{orderData.price} EGP</p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="fas fa-flag text-orange-600"></i>
                        <strong className="text-blue-800">Status</strong>
                      </div>
                      <Badge className={`${getStatusColor(orderData.status)} text-sm px-3 py-1`}>
                        {formatStatus(orderData.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Credentials */}
              {credentials ? (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-green-800 flex items-center space-x-3 text-xl">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <i className="fas fa-shield-alt text-white"></i>
                      </div>
                      <span>Account Credentials</span>
                    </CardTitle>
                    <div className="mt-3 p-3 bg-green-100/70 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        <i className="fas fa-info-circle mr-2"></i>
                        Use these credentials to access and modify the account
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Username */}
                      {credentials.username && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-user text-green-600"></i>
                                <strong className="text-green-800">Username</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-mono break-all">{credentials.username}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Username' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.username!, 'Username')}
                            >
                              <i className={`fas ${copiedField === 'Username' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Username' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Password */}
                      {credentials.password && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-lock text-green-600"></i>
                                <strong className="text-green-800">Password</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-mono break-all">{credentials.password}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Password' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.password!, 'Password')}
                            >
                              <i className={`fas ${copiedField === 'Password' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Password' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      {credentials.email && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-envelope text-green-600"></i>
                                <strong className="text-green-800">Email</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-mono break-all">{credentials.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Email' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.email!, 'Email')}
                            >
                              <i className={`fas ${copiedField === 'Email' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Email' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Recovery Email */}
                      {credentials.recoveryEmail && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-envelope-open text-green-600"></i>
                                <strong className="text-green-800">Recovery Email</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-mono break-all">{credentials.recoveryEmail}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Recovery Email' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.recoveryEmail!, 'Recovery Email')}
                            >
                              <i className={`fas ${copiedField === 'Recovery Email' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Recovery Email' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Phone Number */}
                      {credentials.phoneNumber && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-phone text-green-600"></i>
                                <strong className="text-green-800">Phone Number</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-mono break-all">{credentials.phoneNumber}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Phone Number' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.phoneNumber!, 'Phone Number')}
                            >
                              <i className={`fas ${copiedField === 'Phone Number' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Phone Number' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Security Questions */}
                      {credentials.securityQuestions && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-question-circle text-green-600"></i>
                                <strong className="text-green-800">Security Questions</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 break-all">{credentials.securityQuestions}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Security Questions' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.securityQuestions!, 'Security Questions')}
                            >
                              <i className={`fas ${copiedField === 'Security Questions' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Security Questions' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Two Factor Auth */}
                      {credentials.twoFactorAuth && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-shield-alt text-green-600"></i>
                                <strong className="text-green-800">Two Factor Auth</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 break-all">{credentials.twoFactorAuth}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Two Factor Auth' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.twoFactorAuth!, 'Two Factor Auth')}
                            >
                              <i className={`fas ${copiedField === 'Two Factor Auth' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Two Factor Auth' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      {credentials.additionalInfo && (
                        <div className="group bg-white/80 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <i className="fas fa-info-circle text-green-600"></i>
                                <strong className="text-green-800">Additional Information</strong>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 break-all">{credentials.additionalInfo}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={`ml-4 transition-all duration-200 ${
                                copiedField === 'Additional Info' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                              onClick={() => copyToClipboard(credentials.additionalInfo!, 'Additional Info')}
                            >
                              <i className={`fas ${copiedField === 'Additional Info' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                              {copiedField === 'Additional Info' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Credentials Available</h3>
                    <p className="text-yellow-700 mb-2">
                      The seller hasn't provided account credentials yet. 
                      Please wait for them to add the account details.
                    </p>
                    <p className="text-xs text-yellow-600">
                      Order Status: {formatStatus(orderData.status)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Copy All Credentials Button */}
              {credentials && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="pt-6">
                    <Button
                      className={`w-full transition-all duration-200 ${
                        copiedField === 'All Credentials' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      }`}
                      onClick={() => {
                        const allCredentials = `
Account Credentials for ${orderData.gameAccountTitle}:
Username: ${credentials.username || 'Not provided'}
Password: ${credentials.password || 'Not provided'}
Email: ${credentials.email || 'Not provided'}
Recovery Email: ${credentials.recoveryEmail || 'Not provided'}
Phone Number: ${credentials.phoneNumber || 'Not provided'}
Security Questions: ${credentials.securityQuestions || 'Not provided'}
Two Factor Auth: ${credentials.twoFactorAuth || 'Not provided'}
Additional Info: ${credentials.additionalInfo || 'Not provided'}
                        `.trim();
                        copyToClipboard(allCredentials, 'All Credentials');
                      }}
                    >
                      <i className={`fas ${copiedField === 'All Credentials' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                      {copiedField === 'All Credentials' ? 'All Credentials Copied!' : 'Copy All Credentials'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Important Notice */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-exclamation-circle text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-800 mb-3 text-lg">Important Security Notice</h4>
                      <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                        <ul className="text-sm text-red-700 space-y-2">
                          <li className="flex items-start space-x-2">
                            <i className="fas fa-shield-alt text-red-500 mt-0.5"></i>
                            <span>Change the password immediately after accessing the account</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <i className="fas fa-envelope text-red-500 mt-0.5"></i>
                            <span>Update the email address to your own email</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <i className="fas fa-lock text-red-500 mt-0.5"></i>
                            <span>Enable two-factor authentication if available</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <i className="fas fa-user-secret text-red-500 mt-0.5"></i>
                            <span>Keep these credentials secure and don't share them</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <i className="fas fa-handshake text-red-500 mt-0.5"></i>
                            <span>The seller is no longer responsible for the account after delivery</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountCredentialsModal;
