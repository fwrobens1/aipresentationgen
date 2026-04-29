import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlideElement as SlideElementType } from '@/types/slide';

interface Props {
  element: SlideElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlideElementType>) => void;
  onDelete: () => void;
}

export const SlideElementComponent: React.FC<Props> = ({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      elX: element.x,
      elY: element.y,
    };
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: element.width,
      h: element.height,
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const move = (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        onUpdate({
          x: Math.round(dragStart.current.elX + dx),
          y: Math.round(dragStart.current.elY + dy),
        });
      }
      if (isResizing) {
        const dx = (e.clientX - resizeStart.current.x) / scale;
        const dy = (e.clientY - resizeStart.current.y) / scale;
        onUpdate({
          width: Math.max(40, Math.round(resizeStart.current.w + dx)),
          height: Math.max(30, Math.round(resizeStart.current.h + dy)),
        });
      }
    };
    const up = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [isDragging, isResizing, scale, onUpdate]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === 'text') setIsEditing(true);
  };

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (textRef.current) onUpdate({ content: textRef.current.innerText });
  }, [onUpdate]);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation || 0}deg)`,
        opacity: element.opacity ?? 1,
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
      }}
    >
      {element.type === 'text' && (
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '100%',
            color: element.color,
            backgroundColor: element.backgroundColor,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            textAlign: element.textAlign,
            border: element.borderWidth
              ? `${element.borderWidth}px solid ${element.borderColor}`
              : 'none',
            padding: '4px 8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.3,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        >
          {element.content}
        </div>
      )}

      {element.type === 'image' && element.imageUrl && (
        <img
          src={element.imageUrl}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      )}

      {element.type === 'shape' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor:
              element.backgroundColor === 'transparent'
                ? '#3b82f6'
                : element.backgroundColor,
            border: element.borderWidth
              ? `${element.borderWidth}px solid ${element.borderColor}`
              : 'none',
          }}
        />
      )}

      {/* Selection outline + resize handle */}
      {isSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `${Math.max(1, 2 / scale)}px solid #3b82f6`,
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            onMouseDown={handleResizeDown}
            style={{
              position: 'absolute',
              right: -6 / scale,
              bottom: -6 / scale,
              width: 12 / scale,
              height: 12 / scale,
              background: '#3b82f6',
              border: '2px solid white',
              borderRadius: 2,
              cursor: 'nwse-resize',
            }}
          />
        </>
      )}
    </div>
  );
};
