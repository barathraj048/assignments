// client/src/hooks/useConversation.js
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../lib/api';

export const useConversation = () => {
  const [sessionId]                 = useState(() => uuidv4());
  const [messages,  setMessages]    = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState(null);
  const [patientCtx, setPatientCtx] = useState({
    name: '', disease: '', location: '', additionalInfo: ''
  });

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || loading) return;

    // Show user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/chat', {
        sessionId,
        message:        userText,
        patientContext: patientCtx,
      });
      setMessages(prev => [...prev, { role: 'assistant', ...data }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [sessionId, patientCtx, loading]);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages, loading, error,
    patientCtx, setPatientCtx,
    sendMessage, clearChat
  };
};