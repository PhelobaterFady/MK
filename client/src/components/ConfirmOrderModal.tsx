import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: {
    id: string;
    gameAccountTitle: string;
    price: number;
    buyerName: string;
    sellerName: string;
  } | null;
}

const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  orderData 
}) => {
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the terms before confirming the order",
        variant: "destructive",
      });
      return;
    }

    setConfirming(true);
    try {
      await onConfirm();
      toast({
        title: "Order Confirmed",
        description: "The order has been confirmed and money will be transferred to the seller",
      });
      onClose();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Error",
        description: "Failed to confirm the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen || !orderData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl h-[85vh] shadow-2xl border-0 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg flex-shrink-0">
          <CardTitle className="text-center text-xl flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-white"></i>
            </div>
            <span>Confirm Order - Important Notice</span>
          </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-y-auto">
          <CardContent className="space-y-6 p-6">
          {/* Order Summary */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 flex items-center space-x-2">
                <i className="fas fa-info-circle text-blue-600"></i>
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-gamepad text-blue-600"></i>
                    <strong className="text-blue-800">Account</strong>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">{orderData.gameAccountTitle}</p>
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
                    <i className="fas fa-user-tie text-purple-600"></i>
                    <strong className="text-blue-800">Seller</strong>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">{orderData.sellerName}</p>
                </div>
                <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-user text-orange-600"></i>
                    <strong className="text-blue-800">Buyer</strong>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">{orderData.buyerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-800 flex items-center space-x-3 text-xl">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-circle text-white"></i>
                </div>
                <span>Important Notice - Read Carefully</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                <p className="text-red-700 font-semibold mb-4 text-center">
                  By confirming this order, you acknowledge and agree to the following:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-shield-alt text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>The website is NOT responsible</strong> for any issues that may occur after confirmation
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-check-circle text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>You have received the account</strong> and verified all details are correct
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-key text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>You have changed all account credentials</strong> (password, email, etc.)
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-money-bill-wave text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>The money will be transferred</strong> to the seller immediately upon confirmation
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-ban text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>No refunds or disputes</strong> will be accepted after confirmation
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <i className="fas fa-thumbs-up text-red-500 mt-0.5"></i>
                    <span className="text-sm text-red-700">
                      <strong>You are satisfied</strong> with the account and its condition
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-red-100 rounded-lg border-2 border-red-300">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    <p className="font-bold text-red-800 text-center flex-1">
                      WARNING: Once you confirm, the transaction is final and irreversible!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreement Checkbox */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <Checkbox
                    id="agree-terms"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="border-2 border-orange-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="agree-terms"
                    className="text-sm font-medium text-orange-800 leading-relaxed cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-handshake text-orange-600"></i>
                      <span className="font-semibold">Agreement Required</span>
                    </div>
                    I have read and understood the above terms and conditions. I confirm that I have received the account and am satisfied with it. I understand that the website is not responsible for any issues after confirmation.
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          </CardContent>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 bg-white/50 border-t border-gray-200">
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              disabled={confirming}
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!agreed || confirming}
              className={`flex-1 h-12 transition-all duration-200 ${
                !agreed 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Confirm Order
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmOrderModal;
