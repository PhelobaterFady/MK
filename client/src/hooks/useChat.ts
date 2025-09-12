import { useState, useEffect, useCallback } from 'react';
import { ref, push, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../lib/firebase';
import { ChatMessage, InsertChatMessage } from '@shared/schema';
import { useAuth } from './useAuth';

export function useChat(orderId: string) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const messagesRef = ref(database, 'chatMessages');
    const messagesQuery = query(messagesRef, orderByChild('orderId'), equalTo(orderId));

    const unsubscribe = onValue(
      messagesQuery,
      (snapshot) => {
        try {
          const messagesData: ChatMessage[] = [];
          
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const messageData = childSnapshot.val();
              messagesData.push({
                id: childSnapshot.key!,
                ...messageData,
                timestamp: new Date(messageData.timestamp)
              });
            });
          }

          // Sort messages by timestamp
          messagesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          setMessages(messagesData);
          setError(null);
        } catch (err) {
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentUser || !orderId || !content.trim()) {
      throw new Error('Missing required data for sending message');
    }

    // Content filtering for contact information
    const contactInfoPattern = /@|\.com|phone|discord|skype|telegram|whatsapp|email|gmail|yahoo|hotmail|\+\d|call|text|contact/i;
    const isFiltered = contactInfoPattern.test(content);

    const messageData: InsertChatMessage = {
      orderId,
      senderId: currentUser.uid,
      content: content.trim(),
      isFiltered,
      filteredReason: isFiltered ? 'Contact information detected' : undefined
    };

    const messagesRef = ref(database, 'chatMessages');
    await push(messagesRef, {
      ...messageData,
      timestamp: new Date().toISOString()
    });

    if (isFiltered) {
      throw new Error('Message contains contact information and has been flagged for review.');
    }
  }, [currentUser, orderId]);

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}

export function useChatParticipants(orderId: string) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order to get buyer and seller IDs
        const orderRef = ref(database, `orders/${orderId}`);
        const orderSnapshot = await get(orderRef);
        
        if (!orderSnapshot.exists()) {
          setLoading(false);
          return;
        }

        const orderData = orderSnapshot.val();
        const participantIds = [orderData.buyerId, orderData.sellerId];

        // Fetch participant details
        const participantPromises = participantIds.map(async (id) => {
          const userRef = ref(database, `users/${id}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            return {
              id,
              ...userSnapshot.val()
            };
          }
          return null;
        });

        const participantData = await Promise.all(participantPromises);
        setParticipants(participantData.filter(Boolean));
      } catch (error) {
        console.error('Error fetching chat participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [orderId]);

  return { participants, loading };
}
