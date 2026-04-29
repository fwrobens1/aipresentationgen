import { Presentation, Slide } from '@/types/presentation';
import { supabase } from '@/integrations/supabase/client';

const uid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);

export async function generatePresentation(prompt: string): Promise<{ presentation: Presentation; message: string }> {
  const { data, error } = await supabase.functions.invoke('generate-slides', {
    body: { prompt },
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate presentation');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const slides: Slide[] = (data.slides || []).map((s: any) => ({
    id: s.id || uid(),
    title: s.title || '',
    subtitle: s.subtitle,
    content: s.content,
    bulletPoints: s.bulletPoints,
    imageUrl: s.imageUrl,
    layout: s.layout || 'content',
    notes: s.notes,
  }));

  const title = data.title || prompt.slice(0, 40);

  const presentation: Presentation = {
    id: uid(),
    title,
    description: prompt,
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const topicList = slides
    .filter(s => s.layout !== 'title')
    .slice(0, 6)
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join('\n');

  const message = `I've created a presentation titled **"${title}"** with ${slides.length} slides covering:\n\n${topicList}\n\nClick the preview below to view it, or ask me to make changes!`;

  return { presentation, message };
}
