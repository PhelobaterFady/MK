import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ChatInterface from '@/components/ChatInterface';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, update } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { getUser } from '@/services/firebase-api';

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: number;
    senderId: string;
    senderName: string;
    type: 'text' | 'offer' | 'counter_offer';
  };
  accountInfo?: {
    accountId: string;
    accountTitle: string;
    accountPrice: number;
  };
  unreadCount: number;
}

const Chat: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) return;

    const loadChatRooms = async () => {
      try {
        setLoading(true);
        
        // Get all chat rooms where current user is a participant
        const chatsRef = ref(database, 'chats');
        const chatsSnapshot = await get(chatsRef);
        
        if (!chatsSnapshot.exists()) {
          setChatRooms([]);
          setLoading(false);
          return;
        }

        const chatsData = chatsSnapshot.val();
        const userChatRooms: ChatRoom[] = [];

        // Filter chat rooms where current user is a participant
        Object.entries(chatsData).forEach(([chatId, chatData]: [string, any]) => {
          const participants = chatId.split('_');
          if (participants.includes(currentUser.uid)) {
            const otherParticipantId = participants.find(id => id !== currentUser.uid);
            
            // Get the last message
            let lastMessage = null;
            let unreadCount = 0;
            
            if (chatData.messages) {
              const messages = Object.values(chatData.messages) as any[];
              if (messages.length > 0) {
                // Sort by timestamp to get the last message
                const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
                lastMessage = sortedMessages[0];
                
                // Count unread messages (messages not sent by current user)
                unreadCount = messages.filter(msg => 
                  msg.senderId !== currentUser.uid && 
                  !msg.readBy?.[currentUser.uid]
                ).length;
              }
            }

            // Get account info if available
            let accountInfo = null;
            if (chatData.accountInfo) {
              accountInfo = chatData.accountInfo;
            }

            userChatRooms.push({
              id: chatId,
              participants,
              lastMessage,
              accountInfo,
              unreadCount
            });
          }
        });

        // Sort by last message timestamp
        userChatRooms.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return b.lastMessage.timestamp - a.lastMessage.timestamp;
        });

        setChatRooms(userChatRooms);
      } catch (error) {
        console.error('Error loading chat rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();

    // Listen for new messages
    const chatsRef = ref(database, 'chats');
    const unsubscribe = onValue(chatsRef, () => {
      loadChatRooms();
    });

    return () => {
      off(chatsRef);
    };
  }, [currentUser]);

  const getOtherParticipantName = (participants: string[]) => {
    const otherParticipantId = participants.find(id => id !== currentUser?.uid);
    return participantNames[otherParticipantId || ''] || `User ${otherParticipantId?.slice(-4)}`;
  };

  // Load participant names
  useEffect(() => {
    if (!currentUser || chatRooms.length === 0) return;

    const loadParticipantNames = async () => {
      const names: Record<string, string> = {};
      
      for (const room of chatRooms) {
        const otherParticipantId = room.participants.find(id => id !== currentUser.uid);
        if (otherParticipantId && !names[otherParticipantId]) {
          try {
            const user = await getUser(otherParticipantId);
            names[otherParticipantId] = user?.username || `User ${otherParticipantId.slice(-4)}`;
          } catch (error) {
            console.error('Error loading user:', error);
            names[otherParticipantId] = `User ${otherParticipantId.slice(-4)}`;
          }
        }
      }
      
      setParticipantNames(names);
    };

    loadParticipantNames();
  }, [chatRooms, currentUser]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchTerm) return true;
    const otherParticipant = getOtherParticipantName(room.participants);
    const accountTitle = room.accountInfo?.accountTitle || '';
    return otherParticipant.toLowerCase().includes(searchTerm.toLowerCase()) ||
           accountTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openChat = async (chatRoom: ChatRoom) => {
    setSelectedChat(chatRoom);
    
    // Mark messages as read when opening chat
    if (currentUser && chatRoom.unreadCount > 0) {
      try {
        const messagesRef = ref(database, `chats/${chatRoom.id}/messages`);
        const snapshot = await get(messagesRef);
        
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const updates: any = {};
          
          Object.entries(messagesData).forEach(([messageId, messageData]: [string, any]) => {
            if (messageData.senderId !== currentUser.uid && !messageData.readBy?.[currentUser.uid]) {
              updates[`chats/${chatRoom.id}/messages/${messageId}/readBy/${currentUser.uid}`] = true;
            }
          });
          
          if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const closeChat = () => {
    setSelectedChat(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading conversations...</p>
          </div>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-comments text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Chat</h1>
                <p className="text-slate-400">Connect with sellers and negotiate deals</p>
              </div>
            </div>
          </div>
          
          {chatRooms.length > 0 && (
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <i className="fas fa-comments text-blue-400"></i>
                <span>{chatRooms.length} conversations</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-bell text-red-500"></i>
                <span>{chatRooms.reduce((total, room) => total + room.unreadCount, 0)} unread messages</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex-shrink-0 border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Conversations</span>
                  {chatRooms.reduce((total, room) => total + room.unreadCount, 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {chatRooms.reduce((total, room) => total + room.unreadCount, 0)}
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="mt-4">
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredChatRooms.length === 0 ? (
                    <div className="text-center text-slate-400 py-8 px-4">
                      <i className="fas fa-comments text-4xl mb-4"></i>
                      <p className="text-lg font-semibold mb-2">No conversations yet</p>
                      <p className="text-sm mb-4">Start chatting with sellers to negotiate deals!</p>
                      
                      {chatRooms.length === 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4 max-w-md mx-auto">
                          <h4 className="font-semibold mb-2 text-white">💡 How to start chatting:</h4>
                          <ul className="text-sm text-left space-y-1 text-slate-300">
                            <li>• Go to Marketplace</li>
                            <li>• Click "Contact Seller" on any account</li>
                            <li>• Start negotiating the price!</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {filteredChatRooms.map((room) => {
                        const isSelected = selectedChat?.id === room.id;
                        return (
                          <div
                            key={room.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600/20 border border-blue-500/30' 
                                : 'hover:bg-slate-700/50 border border-transparent'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openChat(room);
                            }}
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                {getOtherParticipantName(room.participants)[0].toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-white truncate">
                                  {getOtherParticipantName(room.participants)}
                                </p>
                                {room.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {room.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              
                              {room.accountInfo && (
                                <p className="text-sm text-slate-400 truncate">
                                  About: {room.accountInfo.accountTitle} - ${room.accountInfo.accountPrice}
                                </p>
                              )}
                              
                              {room.lastMessage && (
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-sm text-slate-500 truncate">
                                    {room.lastMessage.type === 'offer' && '💰 '}
                                    {room.lastMessage.type === 'counter_offer' && '🔄 '}
                                    {room.lastMessage.content}
                                  </p>
                                  <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                    {formatTime(room.lastMessage.timestamp)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col bg-slate-800/50 border-slate-700/50">
              {selectedChat ? (
                <>
                  <CardHeader className="flex-shrink-0 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {getOtherParticipantName(selectedChat.participants)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-white">
                            Chat with {getOtherParticipantName(selectedChat.participants)}
                          </CardTitle>
                          {selectedChat.accountInfo && (
                            <p className="text-slate-400 text-sm">
                              About: {selectedChat.accountInfo.accountTitle} - ${selectedChat.accountInfo.accountPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedChat(null)}
                        className="text-white hover:bg-white/10"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ChatInterface
                      sellerId={selectedChat.participants.find(id => id !== currentUser?.uid) || ''}
                      buyerId={currentUser?.uid || ''}
                      accountId={selectedChat.accountInfo?.accountId || ''}
                      accountTitle={selectedChat.accountInfo?.accountTitle || 'Unknown Account'}
                      accountPrice={selectedChat.accountInfo?.accountPrice || 0}
                      sellerName={getOtherParticipantName(selectedChat.participants)}
                      onClose={closeChat}
                      embedded={true}
                    />
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fas fa-comments text-blue-400 text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                    <p className="text-sm mb-4">Choose a conversation from the sidebar to start chatting</p>
                    
                    {chatRooms.length === 0 && (
                      <div className="bg-slate-700/50 rounded-lg p-4 max-w-md mx-auto">
                        <h4 className="font-semibold mb-2 text-white">💡 How to start chatting:</h4>
                        <ul className="text-sm text-left space-y-1 text-slate-300">
                          <li>• Go to Marketplace</li>
                          <li>• Click "Contact Seller" on any account</li>
                          <li>• Start negotiating the price!</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;