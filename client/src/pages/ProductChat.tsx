import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { database, storage } from '@/lib/firebase';
import { ref, push, onValue, off, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrencySymbol } from '@/utils/currency';
import { GameAccount, User } from '@shared/schema';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'offer' | 'counter_offer' | 'product' | 'image';
  offerPrice?: number;
  originalPrice?: number;
  imageUrl?: string;
  productData?: {
    id: string;
    title: string;
    price: number;
    image?: string;
    gameSpecificData: any;
  };
}

const ProductChat: React.FC = () => {
  const [, params] = useRoute('/chat/:accountId');
  const { currentUser, userProfile } = useAuth();
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.accountId || !currentUser) return;

      try {
        // Fetch account details
        const accountRef = ref(database, `gameAccounts/${params.accountId}`);
        const accountSnapshot = await get(accountRef);

        if (accountSnapshot.exists()) {
          const accountData = accountSnapshot.val();
          const accountWithId: GameAccount = {
            id: params.accountId,
            ...accountData,
            createdAt: new Date(accountData.createdAt),
            updatedAt: new Date(accountData.updatedAt),
            featuredUntil: accountData.featuredUntil ? new Date(accountData.featuredUntil) : undefined
          };
          setAccount(accountWithId);

          // Fetch seller details
          const sellerRef = ref(database, `users/${accountData.sellerId}`);
          const sellerSnapshot = await get(sellerRef);
          
          if (sellerSnapshot.exists()) {
            const sellerData = sellerSnapshot.val();
            setSeller({
              id: accountData.sellerId,
              ...sellerData,
              joinDate: new Date(sellerData.joinDate),
              lastActive: sellerData.lastActive ? new Date(sellerData.lastActive) : undefined
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [params?.accountId, currentUser]);

  // Send product message after data is loaded (only once)
  useEffect(() => {
    if (account && seller && currentUser && messages.length === 0) {
      console.log('Data loaded, sending product message...');
      // Small delay to ensure chat is initialized
      setTimeout(() => {
        sendProductMessage();
      }, 1000);
    }
  }, [account, seller, currentUser]);

  useEffect(() => {
    if (!currentUser || !seller) return;

    const chatRoomId = [seller.id, currentUser.uid].sort().join('_');
    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    
    chatRef.current = messagesRef;

    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList: Message[] = [];

        // Get user profiles for sender names
        const userIds = new Set<string>();
        Object.values(messagesData).forEach((message: any) => {
          userIds.add(message.senderId);
        });

        const userProfiles: { [key: string]: string } = {};
        for (const userId of userIds) {
          try {
            const userRef = ref(database, `users/${userId}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
              userProfiles[userId] = userSnapshot.val().username || 'Unknown User';
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            userProfiles[userId] = 'Unknown User';
          }
        }

        Object.entries(messagesData).forEach(([messageId, messageData]: [string, any]) => {
          messagesList.push({
            id: messageId,
            senderId: messageData.senderId,
            senderName: userProfiles[messageData.senderId] || 'Unknown User',
            content: messageData.content,
            timestamp: messageData.timestamp,
            type: messageData.type || 'text',
            offerPrice: messageData.offerPrice,
            originalPrice: messageData.originalPrice,
            productData: messageData.productData
          });
        });

        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        console.log('Loaded messages:', messagesList);
        setMessages(messagesList);

        // Check if product message already exists
        const hasProductMessage = messagesList.some(msg => 
          msg.type === 'product' && msg.content.includes(account?.title || '')
        );

        // Only send product message if no product message exists and no messages
        if (!hasProductMessage && account && seller && currentUser && messagesList.length === 0) {
          console.log('Sending product message...');
          await sendProductMessage();
        }

        // Mark messages as read
        if (currentUser) {
          const updates: any = {};
          Object.entries(messagesData).forEach(([messageId, messageData]: [string, any]) => {
            if (messageData.senderId !== currentUser.uid && !messageData.readBy?.[currentUser.uid]) {
              updates[`chats/${chatRoomId}/messages/${messageId}/readBy/${currentUser.uid}`] = true;
            }
          });
          
          if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
          }
        }
      } else {
        setMessages([]);
        console.log('No messages found, account:', account?.title);
        // If no messages exist and we have account data, send product message
        if (account && seller && currentUser) {
          console.log('Sending product message (no messages)...');
          await sendProductMessage();
        }
      }
      setLoading(false);
    });

    return () => {
      if (chatRef.current) {
        off(chatRef.current, 'value', unsubscribe);
      }
    };
  }, [currentUser, seller, account]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send product message when page loads
  useEffect(() => {
    if (account && seller && currentUser && messages.length === 0) {
      console.log('Page loaded, sending product message...');
      sendProductMessage();
    }
  }, [account, seller, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendProductMessage = async () => {
    if (!currentUser || !seller || !account) return;

    try {
      const chatRoomId = [seller.id, currentUser.uid].sort().join('_');
      const messageData = {
        senderId: currentUser.uid,
        content: `I'm interested in this account: ${account.title}`,
        timestamp: Date.now(),
        type: 'product',
        productData: {
          id: account.id,
          title: account.title,
          price: account.price,
          image: account.images.length > 0 ? account.images[0] : undefined,
          gameSpecificData: account.gameSpecificData
        },
        readBy: {
          [currentUser.uid]: true
        }
      };

      console.log('Sending product message:', messageData);
      await push(ref(database, `chats/${chatRoomId}/messages`), messageData);
      console.log('Product message sent successfully');
    } catch (error) {
      console.error('Error sending product message:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !seller || sending) return;

    setSending(true);
    try {
      const chatRoomId = [seller.id, currentUser.uid].sort().join('_');
      const messageData = {
        senderId: currentUser.uid,
        content: newMessage.trim(),
        timestamp: Date.now(),
        type: 'text',
        readBy: {
          [currentUser.uid]: true
        }
      };

      await push(ref(database, `chats/${chatRoomId}/messages`), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser || !userProfile || !seller) return;

    setUploadingImage(true);
    try {
      const chatRoomId = [seller.id, currentUser.uid].sort().join('_');
      
      // Upload image to Firebase Storage
      const imageRef = storageRef(storage, `chat-images/${chatRoomId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Send image message
      const messageData = {
        senderId: currentUser.uid,
        senderName: userProfile.username,
        content: '',
        timestamp: Date.now(),
        type: 'image',
        imageUrl: downloadURL,
        readBy: {
          [currentUser.uid]: true
        }
      };

      await push(ref(database, `chats/${chatRoomId}/messages`), messageData);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageUpload(file);
        }
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (senderId: string) => senderId === currentUser?.uid;

  const handleBackToMarketplace = () => {
    window.location.href = '/marketplace';
  };

  const handleViewProduct = () => {
    if (account) {
      window.location.href = `/account/${account.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account || !seller) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Account not found</h1>
          <Button onClick={handleBackToMarketplace}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToMarketplace}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {seller.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Chat with {seller.username}</h1>
                <p className="text-slate-400">About: {account.title}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto h-[calc(100vh-200px)]">
          {/* Chat Messages */}
          <div className="w-full h-full">
            <Card className="bg-slate-800/50 border-slate-700/50 h-full flex flex-col">
              <CardHeader className="border-b border-slate-700/50 flex-shrink-0">
                <CardTitle className="text-white">Messages</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <i className="fas fa-comments text-4xl text-slate-500 mb-4"></i>
                        <p className="text-slate-400">Start a conversation about this product</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start'} w-full`}
                        >
                          {message.type === 'product' ? (
                            <div className="max-w-lg w-full">
                              {/* Product Card */}
                              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-3 relative">
                                {/* Product Details */}
                                <div className="flex items-start space-x-3 mb-3">
                                  {/* Product Icon */}
                                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <img 
                                      src="/src/Public/monkeyicn.png" 
                                      alt="Product" 
                                      className="w-8 h-8 object-contain"
                                    />
                                  </div>
                                  
                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm mb-1">
                                      {message.productData?.title || account?.title}
                                    </h3>
                                    <p className="text-slate-400 text-xs mb-1">
                                      #{message.productData?.id}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Price */}
                                <div className="mb-3">
                                  <div className="text-white font-semibold">
                                    {formatCurrencySymbol(message.productData?.price || 0)}
                                  </div>
                                </div>
                                
                                {/* Security Notice */}
                                <div className="bg-orange-500 rounded-lg p-3 mb-2">
                                  <p className="text-white text-xs leading-relaxed">
                                    To ensure security and prevent scams, only deliver account or product information through the order page using our secure system. Do not share sensitive details in chat.
                                  </p>
                                </div>
                                
                                {/* Timestamp */}
                                <div className="text-right text-slate-400 text-xs">
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          ) : message.type === 'image' ? (
                            <div className="max-w-xs lg:max-w-md">
                              <div className={`px-4 py-3 rounded-lg ${
                                isCurrentUser(message.senderId)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium">
                                    {message.senderName}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                                <img 
                                  src={message.imageUrl} 
                                  alt="Chat image" 
                                  className="max-w-full h-auto rounded-lg mb-2"
                                  style={{ maxHeight: '300px' }}
                                />
                                {message.content && (
                                  <p className="text-sm">{message.content}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg break-words ${
                                isCurrentUser(message.senderId)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.senderName}
                                </span>
                                <span className="text-xs opacity-70">
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-slate-700/50 p-4 flex-shrink-0">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      onPaste={handlePaste}
                      disabled={sending || uploadingImage}
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploadingImage}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {uploadingImage ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-image"></i>
                      )}
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending || uploadingImage}
                      className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                      {sending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane mr-2"></i>
                          Send
                        </>
                      )}
                    </Button>
                  </form>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductChat;
