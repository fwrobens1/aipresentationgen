import React, { useRef } from 'react';
import { SlideElement } from '@/types/slide';
import {
  Type,
  Image as ImageIcon,
  Square,
  Trash2,
  FileUp,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Undo2,
  Redo2,
  Play,
  Download,
  Sparkles,
} from 'lucide-react';

interface Props {
  selectedElement: SlideElement | null;
  slideBackground: string;
  onAddElement: (type: SlideElement['type']) => void;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onDeleteElement: () => void;
  onChangeBackground: (color: string) => void;
  onOpenFile: (file: File) => void;
  onAddImage: (url: string) => void;
  presentationTitle: string;
  onTitleChange: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onPresent: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<Props> = ({
  selectedElement,
  slideBackground,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onChangeBackground,
  onOpenFile,
  onAddImage,
  presentationTitle,
  onTitleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPresent,
  onExport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onOpenFile(f);
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onAddImage(URL.createObjectURL(f));
    e.target.value = '';
  };

  const Btn: React.FC<{
    onClick: () => void;
    title: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    children: React.ReactNode;
  }> = ({ onClick, title, active, disabled, danger, children }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={[
        'grid place-items-center w-8 h-8 rounded-md transition-colors text-muted-foreground',
        'hover:text-foreground hover:bg-muted',
        active ? 'bg-muted text-foreground' : '',
        disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground' : '',
        danger ? 'hover:text-destructive hover:bg-destructive/10' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );

  const Divider = () => <span className="mx-1 h-5 w-px bg-border" />;

  return (
    <div className="shrink-0 border-b border-border bg-card">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">SlideEdit</span>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        <input
          value={presentationTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-foreground/80 font-medium px-2 py-1 rounded hover:bg-muted focus:bg-muted min-w-0 flex-1 transition-colors"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition"
        >
          <FileUp className="w-3.5 h-3.5" /> Open
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
        >
          <Play className="w-3.5 h-3.5" /> Present
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={handleFileOpen}
        />
      </div>

      {/* Tool row */}
      <div className="flex items-center gap-0.5 px-3 h-11 overflow-x-auto">
        <Btn onClick={onUndo} title="Undo" disabled={!canUndo}>
          <Undo2 className="w-4 h-4" />
        </Btn>
        <Btn onClick={onRedo} title="Redo" disabled={!canRedo}>
          <Redo2 className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn onClick={() => onAddElement('text')} title="Add text">
          <Type className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => imageInputRef.current?.click()} title="Add image">
          <ImageIcon className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => onAddElement('shape')} title="Add shape">
          <Square className="w-4 h-4" />
        </Btn>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <Divider />

        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
          BG
          <input
            type="color"
            value={slideBackground}
            onChange={(e) => onChangeBackground(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent"
          />
        </label>

        {selectedElement && (
          <>
            <Divider />

            {selectedElement.type === 'text' && (
              <>
                <div className="flex items-center gap-1 mr-1">
                  <Btn
                    onClick={() =>
                      onUpdateElement({
                        fontSize: Math.max(8, selectedElement.fontSize - 2),
                      })
                    }
                    title="Decrease size"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Btn>
                  <span className="text-[11px] text-muted-foreground w-6 text-center">
                    {selectedElement.fontSize}
                  </span>
                  <Btn
                    onClick={() =>
                      onUpdateElement({ fontSize: selectedElement.fontSize + 2 })
                    }
                    title="Increase size"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Btn>
                </div>

                <Btn
                  onClick={() =>
                    onUpdateElement({
                      fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  title="Bold"
                  active={selectedElement.fontWeight === 'bold'}
                >
                  <Bold className="w-4 h-4" />
                </Btn>
                <Btn
                  onClick={() =>
                    onUpdateElement({
                      fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  title="Italic"
                  active={selectedElement.fontStyle === 'italic'}
                >
                  <Italic className="w-4 h-4" />
                </Btn>

                <Divider />

                <Btn
                  onClick={() => onUpdateElement({ textAlign: 'left' })}
                  title="Left"
                  active={selectedElement.textAlign === 'left'}
                >
                  <AlignLeft className="w-4 h-4" />
                </Btn>
                <Btn
                  onClick={() => onUpdateElement({ textAlign: 'center' })}
                  title="Center"
                  active={selectedElement.textAlign === 'center'}
                >
                  <AlignCenter className="w-4 h-4" />
                </Btn>
                <Btn
                  onClick={() => onUpdateElement({ textAlign: 'right' })}
                  title="Right"
                  active={selectedElement.textAlign === 'right'}
                >
                  <AlignRight className="w-4 h-4" />
                </Btn>

                <Divider />
              </>
            )}

            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
              Color
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => onUpdateElement({ color: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent"
              />
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
              Fill
              <input
                type="color"
                value={
                  selectedElement.backgroundColor === 'transparent'
                    ? '#ffffff'
                    : selectedElement.backgroundColor
                }
                onChange={(e) => onUpdateElement({ backgroundColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent"
              />
            </label>

            <Divider />

            <Btn onClick={onDeleteElement} title="Delete" danger>
              <Trash2 className="w-4 h-4" />
            </Btn>
          </>
        )}
      </div>
    </div>
  );
};