export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  imageUrl?: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
  width: number;
  height: number;
}

export function createDefaultElement(type: SlideElement['type'], x = 100, y = 100): SlideElement {
  const id = crypto.randomUUID();
  const base = {
    id,
    type,
    x,
    y,
    rotation: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left' as const,
    color: '#333333',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    opacity: 1,
  };

  if (type === 'text') {
    return { ...base, width: 400, height: 60, content: 'Double-click to edit' };
  }
  if (type === 'image') {
    return { ...base, width: 400, height: 300, content: '', imageUrl: '' };
  }
  return { ...base, width: 200, height: 200, content: '' };
}

export function createDefaultSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    elements: [],
    background: '#ffffff',
  };
}

export function createDefaultPresentation(): Presentation {
  return {
    title: 'Untitled Presentation',
    slides: [createDefaultSlide()],
    width: 1920,
    height: 1080,
  };
}