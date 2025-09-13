import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface AddAccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: AccountDetails) => void;
  orderData: {
    id: string;
    gameAccountTitle: string;
    price: number;
    buyerName: string;
  } | null;
}

interface AccountDetails {
  username: string;
  password: string;
  email: string;
  recoveryEmail?: string;
  phoneNumber?: string;
  additionalInfo?: string;
  securityQuestions?: string;
  twoFactorAuth?: string;
}

const AddAccountDetailsModal: React.FC<AddAccountDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  orderData 
}) => {
  const { toast } = useToast();
  const [details, setDetails] = useState<AccountDetails>({
    username: '',
    password: '',
    email: '',
    recoveryEmail: '',
    phoneNumber: '',
    additionalInfo: '',
    securityQuestions: '',
    twoFactorAuth: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!details.username || !details.password || !details.email) {
      toast({
        title: "Required Fields Missing",
        description: "Username, Password, and Email are required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(details);
      toast({
        title: "Account Details Submitted",
        description: "The account details have been sent to the buyer",
      });
      onClose();
      // Reset form
      setDetails({
        username: '',
        password: '',
        email: '',
        recoveryEmail: '',
        phoneNumber: '',
        additionalInfo: '',
        securityQuestions: '',
        twoFactorAuth: ''
      });
    } catch (error) {
      console.error('Error submitting account details:', error);
      toast({
        title: "Error",
        description: "Failed to submit account details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AccountDetails, value: string) => {
    setDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !orderData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-key text-blue-500"></i>
                <span>Add Account Details</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Account: <span className="font-semibold">{orderData.gameAccountTitle}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Buyer: <span className="font-semibold">{orderData.buyerName}</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full max-h-[60vh] overflow-y-auto">
            <div className="p-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-800 text-lg flex items-center space-x-2">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>Required Information</span>
                    </CardTitle>
                    <p className="text-sm text-green-700">These fields are mandatory for account access</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-green-800 font-medium">
                          Username/Login *
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          value={details.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Enter the account username"
                          required
                          className="border-green-300 focus:border-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-green-800 font-medium">
                          Password *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={details.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter the account password"
                          required
                          className="border-green-300 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-green-800 font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={details.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter the account email"
                        required
                        className="border-green-300 focus:border-green-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Optional Fields */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-800 text-lg flex items-center space-x-2">
                      <i className="fas fa-info-circle"></i>
                      <span>Additional Information (Optional)</span>
                    </CardTitle>
                    <p className="text-sm text-blue-700">Provide additional details to help the buyer</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recoveryEmail" className="text-blue-800 font-medium">
                          Recovery Email
                        </Label>
                        <Input
                          id="recoveryEmail"
                          type="email"
                          value={details.recoveryEmail}
                          onChange={(e) => handleInputChange('recoveryEmail', e.target.value)}
                          placeholder="Enter recovery email if available"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-blue-800 font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={details.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="Enter phone number if linked"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twoFactorAuth" className="text-blue-800 font-medium">
                        Two-Factor Authentication
                      </Label>
                      <Input
                        id="twoFactorAuth"
                        type="text"
                        value={details.twoFactorAuth}
                        onChange={(e) => handleInputChange('twoFactorAuth', e.target.value)}
                        placeholder="Enter 2FA details if applicable"
                        className="border-blue-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="securityQuestions" className="text-blue-800 font-medium">
                        Security Questions & Answers
                      </Label>
                      <Textarea
                        id="securityQuestions"
                        value={details.securityQuestions}
                        onChange={(e) => handleInputChange('securityQuestions', e.target.value)}
                        placeholder="Enter security questions and their answers"
                        rows={3}
                        className="border-blue-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo" className="text-blue-800 font-medium">
                        Additional Information
                      </Label>
                      <Textarea
                        id="additionalInfo"
                        value={details.additionalInfo}
                        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                        placeholder="Any other important information about the account"
                        rows={3}
                        className="border-blue-300 focus:border-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notice */}
                <Card className="border border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      <i className="fas fa-info-circle mr-2"></i>
                      Important Notice
                    </h4>
                    <p className="text-sm text-orange-700">
                      Make sure all information is accurate. The buyer will receive these details and use them to access the account. 
                      Double-check everything before submitting.
                    </p>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={submitting}
                  >
                    <i className="fas fa-times mr-2"></i>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Confirm Account Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddAccountDetailsModal;
