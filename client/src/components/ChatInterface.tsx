import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { database, storage } from '@/lib/firebase';
import { ref, push, onValue, off, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import ImageModal from '@/components/ImageModal';

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
    gameSpecificData?: any;
  };
}

interface ChatInterfaceProps {
  sellerId: string;
  buyerId: string;
  accountId: string;
  accountTitle: string;
  accountPrice: number;
  sellerName: string;
  onClose: () => void;
  embedded?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sellerId,
  buyerId,
  accountId,
  accountTitle,
  accountPrice,
  sellerName,
  onClose,
  embedded = false
}) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create unique chat room ID
  const chatRoomId = [sellerId, buyerId].sort().join('_');

  useEffect(() => {
    if (!currentUser) return;

    // Listen for messages
    const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
    chatRef.current = messagesRef;

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList: Message[] = Object.entries(messagesData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        
        // Sort by timestamp
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);

        // Mark messages as read when chat is opened
        markMessagesAsRead(messagesList);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => {
      if (chatRef.current) {
        off(chatRef.current);
      }
    };
  }, [chatRoomId, currentUser]);

  const markMessagesAsRead = async (messages: Message[]) => {
    if (!currentUser) return;

    const unreadMessages = messages.filter(msg => 
      msg.senderId !== currentUser.uid && 
      !msg.readBy?.[currentUser.uid]
    );

    if (unreadMessages.length > 0) {
      const updates: any = {};
      unreadMessages.forEach(message => {
        updates[`chats/${chatRoomId}/messages/${message.id}/readBy/${currentUser.uid}`] = true;
      });

      try {
        await update(ref(database), updates);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (type: 'text' | 'offer' | 'counter_offer' = 'text', offerPrice?: number) => {
    if (!currentUser || !userProfile || !newMessage.trim()) return;

    setSending(true);
    try {
      const messageRef = ref(database, `chats/${chatRoomId}/messages`);
      
      const messageData: Omit<Message, 'id'> = {
        senderId: currentUser.uid,
        senderName: userProfile.username,
        content: newMessage.trim(),
        timestamp: Date.now(),
        type,
        ...(offerPrice && { offerPrice }),
        ...(type === 'counter_offer' && { originalPrice: accountPrice })
      };

      await push(messageRef, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const sendTextMessage = () => {
    sendMessage('text');
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser || !userProfile) return;

    setUploadingImage(true);
    try {
      // Upload image to Firebase Storage
      const imageRef = storageRef(storage, `chat-images/${chatRoomId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Send image message
      const messageData: Omit<Message, 'id'> = {
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
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatCurrencySymbol = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.senderId === currentUser?.uid;
    const showDate = index === 0 || 
      formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

    return (
      <div key={message.id}>
        {showDate && (
          <div className="text-center text-xs text-slate-500 my-2">
            {formatDate(message.timestamp)}
          </div>
        )}
        
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
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
                      {message.productData?.title || accountTitle}
                    </h3>
                    <p className="text-slate-400 text-xs mb-1">
                      #{message.productData?.id || accountId}
                    </p>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mb-3">
                  <div className="text-white font-semibold">
                    {formatCurrencySymbol(message.productData?.price || accountPrice)}
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
            <div className="max-w-xs">
              <div className={`px-4 py-2 rounded-lg ${
                isCurrentUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-200'
              }`}>
                <img 
                  src={message.imageUrl} 
                  alt="Chat image" 
                  className="max-w-full h-auto rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '300px' }}
                  onClick={() => handleImageClick(message.imageUrl!)}
                />
                {message.content && (
                  <div className="text-sm">{message.content}</div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-200'
            }`}>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {/* Messages Area with proper height and scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: '300px', maxHeight: 'calc(100vh - 200px)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-blue-400 text-2xl"></i>
              </div>
              <p className="font-semibold mb-2">Start the conversation!</p>
              <p className="text-sm">Discuss price, account details, or ask questions.</p>
            </div>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-700/50 p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendTextMessage();
                }
              }}
              onPaste={handlePaste}
              disabled={sending || uploadingImage}
            />
            <Button 
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
              onClick={sendTextMessage}
              disabled={sending || uploadingImage || !newMessage.trim()}
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
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Chat Sidebar */}
      <Card className="w-full max-w-md h-full flex flex-col bg-slate-800 border-slate-700 shadow-2xl">
        <CardHeader className="flex-shrink-0 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-white">
                <i className="fas fa-comments text-blue-400"></i>
                <span>Chat with {sellerName}</span>
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                About: {accountTitle} - ${accountPrice}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-500/10 hover:text-red-400 text-white">
              <i className="fas fa-times text-lg"></i>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-blue-400 text-2xl"></i>
                </div>
                <p className="font-semibold mb-2">Start the conversation!</p>
                <p className="text-sm">Discuss price, account details, or ask questions.</p>
              </div>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-700 p-4 flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage();
                  }
                }}
                onPaste={handlePaste}
                disabled={sending || uploadingImage}
              />
              <Button 
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
                onClick={sendTextMessage}
                disabled={sending || uploadingImage || !newMessage.trim()}
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
            </div>
            
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

export default ChatInterface;