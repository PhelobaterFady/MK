import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '@shared/schema';

interface ChatInterfaceProps {
  orderId: string;
  participant: {
    id: string;
    username: string;
    isOnline: boolean;
  };
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  orderId,
  participant,
  messages,
  onSendMessage,
  onClose
}) => {
  const { userProfile } = useAuth();
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(messageContent.trim());
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {participant.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold" data-testid="chat-participant-name">
                {participant.username}
              </h3>
              <p className="text-sm text-muted-foreground">
                Order #{orderId} • FIFA 24 Account
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={participant.isOnline ? 'default' : 'secondary'}
              className={participant.isOnline ? 'bg-green-500/20 text-green-400' : ''}
            >
              {participant.isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-chat-button"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === userProfile?.id;
          
          return (
            <div 
              key={message.id} 
              className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
              data-testid={`message-${message.id}`}
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary-foreground">
                  {isOwnMessage ? userProfile?.username[0].toUpperCase() : participant.username[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                  {!isOwnMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  <span className="text-sm font-semibold">
                    {isOwnMessage ? userProfile?.username : participant.username}
                  </span>
                  {isOwnMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className={`rounded-lg p-3 max-w-xs ${
                  isOwnMessage 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.isFiltered && (
                  <div className="mt-2 flex justify-center">
                    <Badge variant="destructive" className="text-xs">
                      <i className="fas fa-shield-alt mr-1"></i>
                      Message flagged: {message.filteredReason}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-6 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <Input
            type="text"
            placeholder="Type your message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={500}
            className="flex-1"
            data-testid="message-input"
          />
          <Button 
            type="submit" 
            disabled={!messageContent.trim() || sending}
            className="gradient-primary"
            data-testid="send-message-button"
          >
            {sending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Messages are filtered for contact info sharing • Max 500 characters
          </p>
          <div className="flex space-x-2">
            <button 
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {/* TODO: Implement report user */}}
              data-testid="report-user-button"
            >
              <i className="fas fa-flag mr-1"></i>
              Report
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
