import React from 'react';
import ChatInterface from '../components/ChatInterface';
import { ChatMessage } from '@shared/schema';

// Mock data
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    orderId: 'GV-2024-001847',
    senderId: 'seller1',
    content: 'Hi! Thanks for purchasing my FIFA account. I\'ll send you the login details shortly.',
    timestamp: new Date('2024-12-15T14:34:00Z'),
    isFiltered: false
  },
  {
    id: '2',
    orderId: 'GV-2024-001847',
    senderId: 'buyer1',
    content: 'Perfect! Looking forward to it. The account details look great from the screenshots.',
    timestamp: new Date('2024-12-15T14:35:00Z'),
    isFiltered: false
  },
  {
    id: '3',
    orderId: 'GV-2024-001847',
    senderId: 'seller1',
    content: 'Email: fifa_pro_2024@email.com Password: SecurePass123! Please change the password after login and confirm delivery once you\'ve accessed the account.',
    timestamp: new Date('2024-12-15T14:38:00Z'),
    isFiltered: true,
    filteredReason: 'Contact info sharing detected'
  }
];

const Chat: React.FC = () => {
  const handleSendMessage = async (content: string) => {
    // TODO: Implement Firebase message sending with contact info filtering
    console.log('Sending message:', content);
    
    // Simulate contact info filtering
    const contactInfoRegex = /@|\.com|phone|discord|skype|telegram|whatsapp/i;
    if (contactInfoRegex.test(content)) {
      throw new Error('Message contains contact information and cannot be sent.');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ChatInterface
          orderId="GV-2024-001847"
          participant={{
            id: 'seller1',
            username: 'mike_trader',
            isOnline: true
          }}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

export default Chat;
