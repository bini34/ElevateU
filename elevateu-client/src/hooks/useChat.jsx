// hooks/useChat.js
"use client";
import { useState, useEffect } from 'react';
import { fetchMessages } from '@/utils/messageUtils';

const useChat = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const loadMessages = async () => {
      const fetchedMessages = await fetchMessages();
      setMessages(fetchedMessages);
    };
    loadMessages();
  }, []);

  return { messages };
};

export default useChat;
