import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  participants: string[];
  last_message?: Message;
  unread_count: number;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  startConversation: (participantId: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load conversations
    loadConversations();

    // Subscribe to new messages
    const channel = supabase.channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        handleNewMessage(newMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .contains('participants', [user?.id])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConversations(data.map(conv => ({
        ...conv,
        last_message: conv.messages[0],
        unread_count: conv.messages.filter((m: Message) => 
          m.sender_id !== user?.id && !m.read
        ).length
      })));
    } catch (err) {
      await errorMonitor.logError({
        operation: 'chat.loadConversations',
        error: err instanceof Error ? err.message : 'Failed to load conversations',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { userId: user?.id }
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_id', user?.id)
        .eq('read', false);
    } catch (err) {
      await errorMonitor.logError({
        operation: 'chat.loadMessages',
        error: err instanceof Error ? err.message : 'Failed to load messages',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { conversationId }
      });
    }
  };

  const handleNewMessage = (message: Message) => {
    // Update messages if in current conversation
    if (message.conversation_id === currentConversation) {
      setMessages(prev => [...prev, message]);
    }

    // Update conversations list
    setConversations(prev =>
      prev.map(conv =>
        conv.id === message.conversation_id
          ? {
              ...conv,
              last_message: message,
              unread_count: message.sender_id !== user?.id
                ? conv.unread_count + 1
                : conv.unread_count
            }
          : conv
      )
    );
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically update UI
      handleNewMessage(data);
    } catch (err) {
      await errorMonitor.logError({
        operation: 'chat.sendMessage',
        error: err instanceof Error ? err.message : 'Failed to send message',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { conversationId }
      });
    }
  };

  const startConversation = async (participantId: string): Promise<string> => {
    try {
      // Check if conversation already exists
      const existing = conversations.find(conv =>
        conv.participants.includes(participantId)
      );

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participants: [user?.id, participantId],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add to conversations list
      setConversations(prev => [{
        ...data,
        unread_count: 0
      }, ...prev]);

      return data.id;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'chat.startConversation',
        error: err instanceof Error ? err.message : 'Failed to start conversation',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { participantId }
      });
      throw err;
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      sendMessage,
      setCurrentConversation,
      startConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}