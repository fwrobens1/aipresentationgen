import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Slide, SlideElement } from '@/types/slide';
import { SlideElementComponent } from './SlideElement';

interface Props {
  slide: Slide;
  slideWidth: number;
  slideHeight: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const SlideCanvas: React.FC<Props> = ({
  slide,
  slideWidth,
  slideHeight,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const sx = (clientWidth - padding) / slideWidth;
    const sy = (clientHeight - padding) / slideHeight;
    setScale(Math.min(sx, sy, 1));
  }, [slideWidth, slideHeight]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No slide selected
      </div>
    );
  }

  const scaledW = slideWidth * scale;
  const scaledH = slideHeight * scale;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSelectElement(null);
      }}
      className="flex-1 relative overflow-hidden bg-[#1a1a1a] flex items-center justify-center"
    >
      <div
        className="relative shadow-2xl"
        style={{
          width: scaledW,
          height: scaledH,
          background: slide.background,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onSelectElement(null);
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: slideWidth,
            height: slideHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {(slide.elements || []).map((el) => (
            <SlideElementComponent
              key={el.id}
              element={el}
              isSelected={selectedElementId === el.id}
              scale={scale}
              onSelect={() => onSelectElement(el.id)}
              onUpdate={(u) => onUpdateElement(el.id, u)}
              onDelete={() => onDeleteElement(el.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};