import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Presentation, Conversation, ChatMessage } from '@/types/presentation';

interface AppState {
  presentations: Presentation[];
  conversations: Conversation[];
  currentConversationId: string | null;
}

interface AppContextType extends AppState {
  addPresentation: (p: Presentation) => void;
  deletePresentation: (id: string) => void;
  createConversation: () => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, msg: ChatMessage) => void;
  linkPresentation: (conversationId: string, presentationId: string) => void;
  getCurrentConversation: () => Conversation | undefined;
}

const STORAGE_KEY = 'slideai-state';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { presentations: [], conversations: [], currentConversationId: null };
}

const AppContext = createContext<AppContextType | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPresentation = useCallback((p: Presentation) => {
    setState(s => ({ ...s, presentations: [p, ...s.presentations] }));
  }, []);

  const deletePresentation = useCallback((id: string) => {
    setState(s => ({ ...s, presentations: s.presentations.filter(p => p.id !== id) }));
  }, []);

  const createConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, conversations: [conv, ...s.conversations], currentConversationId: id }));
    return id;
  }, []);

  const setCurrentConversation = useCallback((id: string | null) => {
    setState(s => ({ ...s, currentConversationId: id }));
  }, []);

  const addMessage = useCallback((conversationId: string, msg: ChatMessage) => {
    setState(s => ({
      ...s,
      conversations: s.conversations.map(c => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages, msg];
        const title = c.messages.length === 0 && msg.role === 'user'
          ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
          : c.title;
        return { ...c, messages, title };
      }),
    }));
  }, []);

  const linkPresentation = useCallback((conversationId: string, presentationId: string) => {
    setState(s => ({
      ...s,
      conversations: s.conversations.map(c =>
        c.id === conversationId ? { ...c, presentationId } : c
      ),
    }));
  }, []);

  const getCurrentConversation = useCallback(() => {
    return state.conversations.find(c => c.id === state.currentConversationId);
  }, [state.conversations, state.currentConversationId]);

  return (
    <AppContext.Provider value={{
      ...state,
      addPresentation,
      deletePresentation,
      createConversation,
      setCurrentConversation,
      addMessage,
      linkPresentation,
      getCurrentConversation,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function usePresentations() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('usePresentations must be used within PresentationProvider');
  return ctx;
}
