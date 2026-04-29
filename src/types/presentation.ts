export type SlideLayout = 'title' | 'content' | 'image-left' | 'image-right' | 'full-image';

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  bulletPoints?: string[];
  imageUrl?: string;
  layout: SlideLayout;
  notes?: string;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  presentation?: Presentation;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  presentationId?: string;
  createdAt: string;
}
