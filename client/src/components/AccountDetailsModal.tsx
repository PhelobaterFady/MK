import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: {
    id: string;
    title: string;
    game: string;
    description: string;
    price: number;
    images: string[];
    features: string[];
    sellerId: string;
    status: string;
    createdAt: string;
  } | null;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  accountData 
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

  if (!isOpen || !accountData) return null;

  console.log('=== ACCOUNT DETAILS MODAL ===');
  console.log('accountData received:', accountData);
  console.log('accountData title:', accountData.title);
  console.log('accountData game:', accountData.game);
  console.log('accountData description:', accountData.description);
  console.log('accountData images:', accountData.images);
  console.log('accountData features:', accountData.features);
  console.log('accountData price:', accountData.price);
  console.log('accountData status:', accountData.status);
  console.log('accountData sellerId:', accountData.sellerId);
  console.log('accountData createdAt:', accountData.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Details - {accountData.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <strong>Account Title:</strong>
                        <p className="text-sm text-muted-foreground font-semibold">{accountData.title || 'No title available'}</p>
                        <p className="text-xs text-muted-foreground">ID: {accountData.id}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(accountData.title, 'Title')}
                      >
                        <i className={`fas ${copiedField === 'Title' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                        {copiedField === 'Title' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <strong>Game:</strong>
                        <p className="text-sm text-muted-foreground font-semibold">{accountData.game || 'No game specified'}</p>
                        <p className="text-xs text-muted-foreground">Seller ID: {accountData.sellerId}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(accountData.game, 'Game')}
                      >
                        <i className={`fas ${copiedField === 'Game' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                        {copiedField === 'Game' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <strong>Price:</strong>
                        <p className="text-sm text-muted-foreground">{accountData.price} EGP</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(accountData.price.toString(), 'Price')}
                      >
                        <i className={`fas ${copiedField === 'Price' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                        {copiedField === 'Price' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <strong>Status:</strong>
                        <Badge className={`ml-2 ${accountData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}>
                          {accountData.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(accountData.status, 'Status')}
                      >
                        <i className={`fas ${copiedField === 'Status' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                        {copiedField === 'Status' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{accountData.description || 'No description available'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(accountData.description, 'Description')}
                    >
                      <i className={`fas ${copiedField === 'Description' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                      {copiedField === 'Description' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              {accountData.features && accountData.features.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Features ({accountData.features.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {accountData.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{String(feature)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(String(feature), `Feature ${index + 1}`)}
                          >
                            <i className={`fas ${copiedField === `Feature ${index + 1}` ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                            {copiedField === `Feature ${index + 1}` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">No features available</p>
                  </CardContent>
                </Card>
              )}

              {/* Images */}
              {accountData.images && accountData.images.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Images ({accountData.images.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {accountData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Account image ${index + 1}`}
                            className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(image, '_blank')}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                            onClick={() => copyToClipboard(image, `Image ${index + 1}`)}
                          >
                            <i className={`fas ${copiedField === `Image ${index + 1}` ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                            {copiedField === `Image ${index + 1}` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">No images available</p>
                  </CardContent>
                </Card>
              )}

              {/* Copy All Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const allData = `
Account Title: ${accountData.title}
Game: ${accountData.game}
Price: ${accountData.price} EGP
Status: ${accountData.status}
Description: ${accountData.description}
Features: ${accountData.features?.join(', ') || 'None'}
Images: ${accountData.images?.join(', ') || 'None'}
                      `.trim();
                      copyToClipboard(allData, 'All Data');
                    }}
                  >
                    <i className={`fas ${copiedField === 'All Data' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {copiedField === 'All Data' ? 'All Data Copied!' : 'Copy All Data'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDetailsModal;
