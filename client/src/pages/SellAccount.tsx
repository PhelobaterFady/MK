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
import { ref, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../lib/firebase';
import { InsertGameAccount } from '@shared/schema';
import { GAMES } from '../utils/constants';

const SellAccount: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    game: '',
    title: '',
    description: '',
    price: '',
    images: [] as File[]
  });
  const [gameSpecificFields, setGameSpecificFields] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleGameChange = (game: string) => {
    setFormData(prev => ({ ...prev, game }));
    setGameSpecificFields({});
  };

  const handleGameFieldChange = (field: string, value: any) => {
    setGameSpecificFields(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images per account.",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `accounts/${currentUser!.uid}/${Date.now()}_${index}.${file.name.split('.').pop()}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  };

  const renderGameSpecificFields = () => {
    switch (formData.game) {
      case 'fifa':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select onValueChange={(value) => handleGameFieldChange('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PS4">PlayStation 4</SelectItem>
                  <SelectItem value="PS5">PlayStation 5</SelectItem>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="coins">FIFA Coins</Label>
              <Input
                type="number"
                placeholder="e.g., 2500000"
                onChange={(e) => handleGameFieldChange('coins', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                type="number"
                placeholder="e.g., 87"
                onChange={(e) => handleGameFieldChange('level', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="overallRating">Overall Rating</Label>
              <Input
                type="number"
                placeholder="e.g., 95"
                onChange={(e) => handleGameFieldChange('overallRating', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select onValueChange={(value) => handleGameFieldChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NA">North America</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                  <SelectItem value="AS">Asia</SelectItem>
                  <SelectItem value="SA">South America</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="transferBan"
                onChange={(e) => handleGameFieldChange('transferBan', e.target.checked)}
              />
              <Label htmlFor="transferBan">Transfer Ban</Label>
            </div>
          </div>
        );

      case 'valorant':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rank">Current Rank</Label>
              <Select onValueChange={(value) => handleGameFieldChange('rank', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iron">Iron</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Immortal">Immortal</SelectItem>
                  <SelectItem value="Radiant">Radiant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rr">Rank Rating (RR)</Label>
              <Input
                type="number"
                placeholder="e.g., 2847"
                onChange={(e) => handleGameFieldChange('rr', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="agents">Agents Owned</Label>
              <Input
                type="number"
                placeholder="e.g., 22"
                max="25"
                onChange={(e) => handleGameFieldChange('agents', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="skins">Weapon Skins</Label>
              <Input
                type="number"
                placeholder="e.g., 47"
                onChange={(e) => handleGameFieldChange('skins', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="level">Account Level</Label>
              <Input
                type="number"
                placeholder="e.g., 150"
                onChange={(e) => handleGameFieldChange('level', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select onValueChange={(value) => handleGameFieldChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NA">North America</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                  <SelectItem value="AP">Asia-Pacific</SelectItem>
                  <SelectItem value="KR">Korea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'lol':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rank">Current Rank</Label>
              <Select onValueChange={(value) => handleGameFieldChange('rank', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iron">Iron</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Grandmaster">Grandmaster</SelectItem>
                  <SelectItem value="Challenger">Challenger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lp">League Points (LP)</Label>
              <Input
                type="number"
                placeholder="e.g., 1247"
                onChange={(e) => handleGameFieldChange('lp', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="champions">Champions Owned</Label>
              <Input
                type="number"
                placeholder="e.g., 158"
                max="164"
                onChange={(e) => handleGameFieldChange('champions', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="skins">Champion Skins</Label>
              <Input
                type="number"
                placeholder="e.g., 89"
                onChange={(e) => handleGameFieldChange('skins', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="level">Account Level</Label>
              <Input
                type="number"
                placeholder="e.g., 247"
                onChange={(e) => handleGameFieldChange('level', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="blueEssence">Blue Essence</Label>
              <Input
                type="number"
                placeholder="e.g., 50000"
                onChange={(e) => handleGameFieldChange('blueEssence', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        );

      case 'pubg':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rank">Current Rank</Label>
              <Select onValueChange={(value) => handleGameFieldChange('rank', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Crown">Crown</SelectItem>
                  <SelectItem value="Ace">Ace</SelectItem>
                  <SelectItem value="Conqueror">Conqueror</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select onValueChange={(value) => handleGameFieldChange('tier', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="IV">IV</SelectItem>
                  <SelectItem value="III">III</SelectItem>
                  <SelectItem value="II">II</SelectItem>
                  <SelectItem value="I">I</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level">Account Level</Label>
              <Input
                type="number"
                placeholder="e.g., 67"
                onChange={(e) => handleGameFieldChange('level', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="bp">Battle Points (BP)</Label>
              <Input
                type="number"
                placeholder="e.g., 15000"
                onChange={(e) => handleGameFieldChange('bp', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="skins">Weapon/Vehicle Skins</Label>
              <Input
                type="number"
                placeholder="e.g., 23"
                onChange={(e) => handleGameFieldChange('skins', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select onValueChange={(value) => handleGameFieldChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NA">North America</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                  <SelectItem value="AS">Asia</SelectItem>
                  <SelectItem value="SA">South America</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'cod':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rank">Current Rank</Label>
              <Select onValueChange={(value) => handleGameFieldChange('rank', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Crimson">Crimson</SelectItem>
                  <SelectItem value="Iridescent">Iridescent</SelectItem>
                  <SelectItem value="Top 250">Top 250</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level">Account Level</Label>
              <Input
                type="number"
                placeholder="e.g., 155"
                onChange={(e) => handleGameFieldChange('level', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="prestige">Prestige</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                max="10"
                onChange={(e) => handleGameFieldChange('prestige', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="kd">K/D Ratio</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 1.85"
                onChange={(e) => handleGameFieldChange('kd', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="wins">Total Wins</Label>
              <Input
                type="number"
                placeholder="e.g., 247"
                onChange={(e) => handleGameFieldChange('wins', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select onValueChange={(value) => handleGameFieldChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NA">North America</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                  <SelectItem value="AS">Asia</SelectItem>
                  <SelectItem value="SA">South America</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to sell an account.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.game || !formData.title || !formData.description || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      // Upload images
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        setUploadProgress(50);
        imageUrls = await uploadImages(formData.images);
      }

      setUploadProgress(80);

      // Create account listing
      const accountData: InsertGameAccount = {
        sellerId: currentUser.uid,
        game: formData.game as any,
        title: formData.title,
        description: formData.description,
        price,
        images: imageUrls,
        gameSpecificData: gameSpecificFields,
        status: 'active'
      };

      const accountsRef = ref(database, 'gameAccounts');
      const newAccountRef = push(accountsRef);
      
      await set(newAccountRef, {
        ...accountData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0
      });

      setUploadProgress(100);

      toast({
        title: "Success!",
        description: "Your account has been listed successfully.",
      });

      // Reset form
      setFormData({
        game: '',
        title: '',
        description: '',
        price: '',
        images: []
      });
      setGameSpecificFields({});

      // Redirect to marketplace
      setTimeout(() => {
        window.location.href = '/marketplace';
      }, 2000);

    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!currentUser) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Alert>
            <AlertDescription>
              You must be logged in to sell an account. Please log in and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Sell Your Game Account</h2>
          <p className="text-muted-foreground">
            List your gaming account for sale on our secure marketplace
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Selection */}
              <div>
                <Label htmlFor="game">Game *</Label>
                <Select value={formData.game} onValueChange={handleGameChange}>
                  <SelectTrigger data-testid="game-select">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Account Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Premium FIFA 24 Account - 95 OVR Team"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    data-testid="title-input"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="299.99"
                    min="1"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    data-testid="price-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your account including achievements, unlocked content, progression, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  maxLength={1000}
                  className="h-32"
                  data-testid="description-textarea"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Game-Specific Fields */}
              {formData.game && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {GAMES.find(g => g.id === formData.game)?.name} Specific Details
                  </h3>
                  {renderGameSpecificFields()}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <Label htmlFor="images">Account Screenshots (up to 5 images)</Label>
                <div className="space-y-4">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={formData.images.length >= 5}
                    data-testid="image-upload"
                  />
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <i className="fas fa-times text-xs"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-4">
                <Alert>
                  <i className="fas fa-info-circle"></i>
                  <AlertDescription>
                    <strong>Important:</strong> By listing your account, you agree to our terms of service.
                    Monlyking takes a 5% commission on successful sales. Accounts must be legitimate and
                    accurately described to avoid suspension.
                  </AlertDescription>
                </Alert>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-lg py-3"
                  disabled={uploading}
                  data-testid="submit-listing-button"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Listing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create Listing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellAccount;
