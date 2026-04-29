import React, { useState, useEffect, useCallback } from 'react';
import { Presentation } from '@/types/slide';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  presentation: Presentation;
  startIndex: number;
  onExit: () => void;
}

export const PresentationMode: React.FC<Props> = ({ presentation, startIndex, onExit }) => {
  const [index, setIndex] = useState(startIndex);
  const slide = presentation.slides[index];

  const next = useCallback(() => {
    if (index < presentation.slides.length - 1) setIndex(i => i + 1);
  }, [index, presentation.slides.length]);

  const prev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExit, next, prev]);

  if (!slide) return null;

  const { width, height } = presentation;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={next}>
      <div
        className="relative"
        style={{
          width,
          height,
          transform: `scale(${Math.min(window.innerWidth / width, window.innerHeight / height)})`,
          transformOrigin: 'center center',
          background: slide.background,
        }}
      >
        {slide.elements.map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              transform: `rotate(${el.rotation}deg)`,
              opacity: el.opacity,
            }}
          >
            {el.type === 'text' && (
              <div
                style={{
                  fontSize: el.fontSize,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  fontStyle: el.fontStyle,
                  textAlign: el.textAlign,
                  color: el.color,
                  backgroundColor: el.backgroundColor === 'transparent' ? undefined : el.backgroundColor,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  padding: '4px 8px',
                  lineHeight: 1.3,
                  width: '100%',
                  height: '100%',
                }}
              >
                {el.content}
              </div>
            )}
            {el.type === 'image' && el.imageUrl && (
              <img src={el.imageUrl} alt="" className="w-full h-full object-contain" draggable={false} />
            )}
            {el.type === 'shape' && (
              <div
                className="w-full h-full rounded"
                style={{
                  backgroundColor: el.backgroundColor || '#e0e0e0',
                  borderColor: el.borderColor,
                  borderWidth: el.borderWidth || 2,
                  borderStyle: 'solid',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={20} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronRight size={24} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {index + 1} / {presentation.slides.length}
      </div>
    </div>
  );
};