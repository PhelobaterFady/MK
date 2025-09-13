import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, push, onValue, off, get, update } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrencySymbol } from '@/utils/currency';
import ImageModal from '@/components/ImageModal';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'offer' | 'counter_offer';
  offerPrice?: number;
  originalPrice?: number;
}

interface ProductChatModalProps {
  sellerId: string;
  buyerId: string;
  accountId: string;
  accountTitle: string;
  accountPrice: number;
  sellerName: string;
  accountImage?: string;
  onClose: () => void;
  onViewProduct: (accountId: string) => void;
}

const ProductChatModal: React.FC<ProductChatModalProps> = ({
  sellerId,
  buyerId,
  accountId,
  accountTitle,
  accountPrice,
  sellerName,
  accountImage,
  onClose,
  onViewProduct
}) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser || !sellerId || !buyerId) return;

    const chatRoomId = [sellerId, buyerId].sort().join('_');
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
            originalPrice: messageData.originalPrice
          });
        });

        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);

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
      }
      setLoading(false);
    });

    return () => {
      if (chatRef.current) {
        off(chatRef.current, 'value', unsubscribe);
      }
    };
  }, [currentUser, sellerId, buyerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      const chatRoomId = [sellerId, buyerId].sort().join('_');
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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (senderId: string) => senderId === currentUser?.uid;

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {sellerName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Chat with {sellerName}</h3>
              <p className="text-sm text-slate-400">About: {accountTitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Product Card */}
          <div className="w-80 border-r border-slate-700 p-4">
            <Card className="bg-slate-800 border-slate-700">
              <div className="relative">
                {accountImage ? (
                  <img
                    src={accountImage}
                    alt={accountTitle}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-700 rounded-t-lg flex items-center justify-center">
                    <i className="fas fa-image text-2xl text-slate-500"></i>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-600 text-white">
                    {formatCurrencySymbol(accountPrice)}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-white mb-2">{accountTitle}</h4>
                <Button
                  onClick={() => onViewProduct(accountId)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <i className="fas fa-eye mr-2"></i>
                  View Product Details
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <i className="fas fa-comments text-4xl text-slate-500 mb-4"></i>
                    <p className="text-slate-400">Start a conversation about this product</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser(message.senderId)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-slate-700 p-4">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
        imageUrl={selectedImage || ''}
        alt="Chat Image"
      />
    </div>
  );
};

export default ProductChatModal;
