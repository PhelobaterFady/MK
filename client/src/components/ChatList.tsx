import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ChatInterface from './ChatInterface';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, query, orderByChild } from 'firebase/database';
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

interface ChatListProps {
  onClose: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

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

  const openChat = (chatRoom: ChatRoom) => {
    setSelectedChat(chatRoom);
  };

  const closeChat = () => {
    setSelectedChat(null);
  };

  if (selectedChat) {
    const otherParticipantId = selectedChat.participants.find(id => id !== currentUser?.uid);
    return (
      <ChatInterface
        sellerId={otherParticipantId || ''}
        buyerId={currentUser?.uid || ''}
        accountId={selectedChat.accountInfo?.accountId || ''}
        accountTitle={selectedChat.accountInfo?.accountTitle || 'Unknown Account'}
        accountPrice={selectedChat.accountInfo?.accountPrice || 0}
        sellerName={getOtherParticipantName(selectedChat.participants)}
        onClose={closeChat}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl h-[80vh] mx-4">
          <CardContent className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-comments text-primary"></i>
              <span>My Conversations</span>
              {chatRooms.reduce((total, room) => total + room.unreadCount, 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {chatRooms.reduce((total, room) => total + room.unreadCount, 0)}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <div className="mt-4">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {filteredChatRooms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <i className="fas fa-comments text-4xl mb-4"></i>
                <p className="text-lg font-semibold mb-2">No conversations yet</p>
                <p className="text-sm">Start chatting with sellers to negotiate deals!</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredChatRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => openChat(room)}
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">
                        {getOtherParticipantName(room.participants)[0].toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {getOtherParticipantName(room.participants)}
                        </p>
                        {room.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {room.accountInfo && (
                        <p className="text-sm text-muted-foreground truncate">
                          About: {room.accountInfo.accountTitle} - ${room.accountInfo.accountPrice}
                        </p>
                      )}
                      
                      {room.lastMessage && (
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage.type === 'offer' && '💰 '}
                            {room.lastMessage.type === 'counter_offer' && '🔄 '}
                            {room.lastMessage.content}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatTime(room.lastMessage.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatList;
