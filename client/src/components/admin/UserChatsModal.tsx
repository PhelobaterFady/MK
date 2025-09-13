import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, query, orderByChild, equalTo } from 'firebase/database';
import { getUser } from '@/services/firebase-api';
import ImageModal from '@/components/ImageModal';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: 'text' | 'image' | 'product' | 'offer' | 'counter_offer';
  imageUrl?: string;
  productData?: {
    id: string;
    title: string;
    price: number;
    image?: string;
    gameSpecificData?: any;
  };
  offerPrice?: number;
  originalPrice?: number;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface User {
  uid: string;
  email: string;
  username: string;
  walletBalance: number;
  accountLevel: number;
  isDisabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserChatsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const UserChatsModal: React.FC<UserChatsModalProps> = ({ user, isOpen, onClose }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [participantNames, setParticipantNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadUserChats = async () => {
      try {
        setLoading(true);
        
        // Get all chat rooms from the chats collection
        const chatsRef = ref(database, 'chats');
        const snapshot = await get(chatsRef);
        
        if (!snapshot.exists()) {
          setChatRooms([]);
          setLoading(false);
          return;
        }

        const chatsData = snapshot.val();
        const userChatRooms: ChatRoom[] = [];

        // Filter chat rooms where the user is a participant
        Object.entries(chatsData).forEach(([roomId, roomData]: [string, any]) => {
          // Extract participants from roomId (format: userId1_userId2)
          const participants = roomId.split('_');
          
          if (participants.includes(user.uid)) {
            // Get messages to find last message and unread count
            const messages = roomData.messages || {};
            const messageEntries = Object.entries(messages);
            
            let lastMessage: ChatMessage | undefined;
            
            if (messageEntries.length > 0) {
              // Sort messages by timestamp to get the last one
              const sortedMessages = messageEntries.sort(([, a]: [string, any], [, b]: [string, any]) => 
                (b.timestamp || 0) - (a.timestamp || 0)
              );
              
              const [lastMessageId, lastMessageData] = sortedMessages[0];
              lastMessage = {
                id: lastMessageId,
                senderId: lastMessageData.senderId,
                receiverId: lastMessageData.receiverId || '',
                message: lastMessageData.content || '',
                timestamp: new Date(lastMessageData.timestamp || 0).toISOString(),
                isRead: lastMessageData.readBy?.[user.uid] || false
              };
            }
            
            userChatRooms.push({
              id: roomId,
              participants: participants,
              lastMessage: lastMessage,
              unreadCount: 0
            });
          }
        });

        // Sort by last message timestamp
        userChatRooms.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        });

        setChatRooms(userChatRooms);

        // Load participant names
        const names: {[key: string]: string} = {};
        const uniqueParticipants = new Set<string>();
        
        userChatRooms.forEach(room => {
          room.participants.forEach(participantId => {
            if (participantId !== user.uid) {
              uniqueParticipants.add(participantId);
            }
          });
        });

        // Fetch names for all unique participants
        for (const participantId of uniqueParticipants) {
          try {
            const userData = await getUser(participantId);
            names[participantId] = userData?.username || userData?.email || 'Unknown User';
          } catch (error) {
            names[participantId] = 'Unknown User';
          }
        }

        setParticipantNames(names);
      } catch (error) {
        console.error('Error loading user chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserChats();
  }, [isOpen, user]);

  const loadChatMessages = async (chatRoom: ChatRoom) => {
    try {
      const messagesRef = ref(database, `chats/${chatRoom.id}/messages`);
      const snapshot = await get(messagesRef);
      
      if (!snapshot.exists()) {
        setChatMessages([]);
        setSelectedChat(chatRoom);
        return;
      }

      const messagesData = snapshot.val();
      const messages: ChatMessage[] = Object.entries(messagesData).map(([id, data]: [string, any]) => ({
        id,
        senderId: data.senderId,
        receiverId: data.receiverId || '',
        message: data.content || '',
        timestamp: new Date(data.timestamp || 0).toISOString(),
        isRead: data.readBy?.[user.uid] || false,
        type: data.type || 'text',
        imageUrl: data.imageUrl,
        productData: data.productData,
        offerPrice: data.offerPrice,
        originalPrice: data.originalPrice
      }));

      // Sort by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setChatMessages(messages);
      setSelectedChat(chatRoom);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const getParticipantName = async (participantId: string) => {
    try {
      const userData = await getUser(participantId);
      return userData?.username || userData?.email || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
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

  const getOtherParticipantName = (room: ChatRoom) => {
    const otherParticipant = room.participants.find(participantId => participantId !== user.uid);
    return otherParticipant ? participantNames[otherParticipant] || 'Unknown User' : 'Unknown User';
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isCurrentUser = message.senderId === user.uid;
    const showDate = index === 0 || 
      formatDate(message.timestamp) !== formatDate(chatMessages[index - 1]?.timestamp);

    return (
      <div key={message.id}>
        {showDate && (
          <div className="text-center text-sm text-slate-400 my-4 bg-slate-700/50 rounded-full py-2 px-4 mx-auto w-fit">
            {formatDate(message.timestamp)}
          </div>
        )}
        
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
          {message.type === 'image' ? (
            <div className="max-w-xs">
              <div className={`px-4 py-2 rounded-2xl shadow-lg ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200'
              }`}>
                <img 
                  src={message.imageUrl} 
                  alt="Chat image" 
                  className="max-w-full h-auto rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '300px' }}
                  onClick={() => handleImageClick(message.imageUrl!)}
                />
                {message.message && (
                  <div className="text-sm">{message.message}</div>
                )}
                <div className={`text-xs mt-2 ${
                  isCurrentUser ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ) : message.type === 'product' ? (
            <div className="max-w-lg w-full">
              <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200'
              }`}>
                {/* Product Card */}
                <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mb-3">
                  {/* Product Details */}
                  <div className="flex items-start space-x-3 mb-3">
                    {/* Product Icon */}
                    <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img 
                        src="/src/Public/monkeyicn.png" 
                        alt="Product" 
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {message.productData?.title || 'Product'}
                      </h3>
                      <p className="text-slate-400 text-xs mb-1">
                        #{message.productData?.id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-3">
                    <div className="text-white font-semibold text-sm">
                      {formatCurrencySymbol(message.productData?.price || 0)}
                    </div>
                  </div>
                  
                  {/* Security Notice */}
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2">
                    <p className="text-orange-200 text-xs leading-relaxed">
                      <i className="fas fa-shield-alt mr-1"></i>
                      Secure delivery through order system only
                    </p>
                  </div>
                </div>
                
                {/* Message Time */}
                <div className={`text-xs ${
                  isCurrentUser ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ) : message.type === 'offer' || message.type === 'counter_offer' ? (
            <div className="max-w-sm">
              <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200'
              }`}>
                <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mb-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className={`fas ${message.type === 'offer' ? 'fa-handshake' : 'fa-exchange-alt'} text-blue-400`}></i>
                    <span className="font-semibold text-sm">
                      {message.type === 'offer' ? 'Price Offer' : 'Counter Offer'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrencySymbol(message.offerPrice || 0)}
                  </div>
                  {message.originalPrice && (
                    <div className="text-xs text-slate-400 line-through">
                      Original: {formatCurrencySymbol(message.originalPrice)}
                    </div>
                  )}
                </div>
                {message.message && (
                  <div className="text-sm mb-2">{message.message}</div>
                )}
                <div className={`text-xs ${
                  isCurrentUser ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className={`max-w-lg px-4 py-3 rounded-2xl shadow-lg ${
              isCurrentUser 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200'
            }`}>
              {/* Message Content */}
              <div className="text-sm leading-relaxed">{message.message}</div>
              
              {/* Message Time */}
              <div className={`text-xs mt-2 ${
                isCurrentUser ? 'text-blue-100' : 'text-slate-400'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchTerm) return true;
    // You can add more sophisticated filtering here
    return room.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <Card className="w-full max-w-7xl h-[95vh] shadow-2xl border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg flex-shrink-0 border-b border-blue-500/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-comments text-white text-xl"></i>
              </div>
              <div>
                <span className="font-bold">Chat History</span>
                <div className="text-blue-200 text-sm font-normal">
                  {user.username} • {user.email}
                </div>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl p-3"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Rooms List */}
          <div className="w-1/3 border-r border-blue-500/30 bg-slate-800/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-blue-500/30">
              <div className="relative">
                <Input
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/50 border-blue-500/30 text-white placeholder-slate-400 rounded-xl pl-10"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : filteredChatRooms.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-comments text-blue-400 text-2xl"></i>
                  </div>
                  <p className="text-lg font-semibold mb-2">No chats found</p>
                  <p className="text-sm">This user has no chat history.</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {filteredChatRooms.map((room) => (
                    <Card
                      key={room.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        selectedChat?.id === room.id 
                          ? 'ring-2 ring-blue-400 bg-blue-500/20 border-blue-400/50' 
                          : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70'
                      }`}
                      onClick={() => loadChatMessages(room)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                                <i className="fas fa-user text-blue-300 text-sm"></i>
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {getOtherParticipantName(room)}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {room.id.substring(0, 12)}...
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 mb-2">
                              {room.participants.length} participants
                            </div>
                            {room.lastMessage && (
                              <div className="text-xs text-slate-300 bg-slate-600/30 rounded-lg p-2 truncate">
                                <i className="fas fa-comment-dots text-blue-400 mr-1"></i>
                                {room.lastMessage.message.substring(0, 40)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col bg-slate-800/30">
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-blue-500/30 bg-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-user text-blue-300"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{getOtherParticipantName(selectedChat)}</h3>
                      <p className="text-sm text-slate-400">
                        {selectedChat.participants.length} participants • {selectedChat.id.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-slate-800/20 to-slate-900/20">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-comments text-blue-400 text-3xl"></i>
                      </div>
                      <p className="text-xl font-semibold mb-2">No messages</p>
                      <p className="text-sm">This chat room has no messages yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message, index) => renderMessage(message, index))}
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-comments text-blue-400 text-4xl"></i>
                  </div>
                  <p className="text-2xl font-semibold mb-3">Select a chat room</p>
                  <p className="text-sm">Choose a chat room from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
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

export default UserChatsModal;