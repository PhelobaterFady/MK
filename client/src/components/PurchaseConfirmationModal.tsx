import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameAccount } from '@shared/schema';
import { formatCurrencySymbol } from '@/utils/currency';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  account: GameAccount | null;
  loading?: boolean;
}

const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  account,
  loading = false
}) => {
  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Confirm Purchase
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Account Details */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{account.title}</h3>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mb-4">
              <span>Game: {account.game}</span>
              <span>•</span>
              <span>Level: {account.level}</span>
            </div>
          </div>

          {/* Price Display */}
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrencySymbol(account.price)}
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>
              <div className="text-sm">
                <p className="font-semibold text-orange-500 mb-1">Important Notice</p>
                <p className="text-muted-foreground">
                  By confirming this purchase, you agree to the terms and conditions. 
                  The payment will be processed immediately and the account details will be provided after confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Confirm Purchase
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmationModal;
