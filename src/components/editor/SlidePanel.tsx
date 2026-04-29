import React from 'react';
import { Slide } from '@/types/slide';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  slides: Slide[];
  currentIndex: number;
  slideWidth: number;
  slideHeight: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

export const SlidePanel: React.FC<Props> = ({
  slides,
  currentIndex,
  slideWidth,
  slideHeight,
  onSelect,
  onAdd,
  onDelete,
}) => {
  // Guard against missing/zero dimensions so we never produce NaN heights.
  const safeW = slideWidth && slideWidth > 0 ? slideWidth : 1920;
  const safeH = slideHeight && slideHeight > 0 ? slideHeight : 1080;
  const thumbW = 200;
  const thumbScale = thumbW / safeW;
  const thumbH = safeH * thumbScale;

  return (
    <aside className="w-[240px] shrink-0 border-r border-border bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Slides
        </span>
        <button
          onClick={onAdd}
          className="p-1 rounded hover:bg-[#2c2c2c] text-muted-foreground hover:text-foreground transition-colors"
          title="Add slide"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {(slides || []).map((slide, i) => (
          <div
            key={slide.id ?? i}
            onClick={() => onSelect(i)}
            className={`relative group cursor-pointer rounded-md border transition-all ${
              i === currentIndex
                ? 'border-primary ring-1 ring-primary/40'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <div
              className="relative overflow-hidden rounded-[5px]"
              style={{
                width: thumbW,
                height: thumbH,
                background: (slide as any).background || '#ffffff',
              }}
            >
              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  width: safeW,
                  height: safeH,
                  transform: `scale(${thumbScale})`,
                }}
              >
                {(slide.elements || []).map((el: any) => (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      color: el.color,
                      background: el.backgroundColor,
                      fontSize: el.fontSize,
                      fontWeight: el.fontWeight,
                      fontStyle: el.fontStyle,
                      textAlign: el.textAlign,
                      overflow: 'hidden',
                    }}
                  >
                    {el.type === 'text' && el.content}
                    {el.type === 'image' && el.imageUrl && (
                      <img
                        src={el.imageUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground bg-[#1e1e1e]/70 px-1 rounded">
              {i + 1}
            </div>

            {slides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(i);
                }}
                className="absolute top-1 right-1 p-1 rounded bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete slide"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};