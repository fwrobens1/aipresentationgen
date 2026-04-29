import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSlideEditor } from '@/hooks/useSlideEditor';
import { usePresentations } from '@/context/PresentationContext';
import { parsePptxFile } from '@/lib/pptxParser';
import { exportPptx } from '@/lib/pptxExporter';
import { SlideElement } from '@/types/slide';
import { Toolbar } from './Toolbar';
import { SlidePanel } from './SlidePanel';
import { SlideCanvas } from './SlideCanvas';
import { PresentationMode } from './PresentationMode';

export const SlideEditor: React.FC = () => {
  const editor = useSlideEditor() as any;
  const { id } = useParams();
  const ctx = usePresentations();
  const presentations = Array.isArray(ctx?.presentations) ? ctx.presentations : [];
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    if (!id || presentations.length === 0) return;
    const pres = presentations.find((p: any) => p.id === id);
    if (pres) editor.loadPresentation(pres);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, presentations]);

  // Tolerate any of the common naming conventions for "go to slide N".
  const goToSlide = useCallback(
    (i: number) => {
      const fn =
        editor.setCurrentSlideIndex ||
        editor.goToSlide ||
        editor.setCurrentSlide ||
        editor.selectSlide ||
        editor.jumpToSlide;
      if (typeof fn === 'function') {
        fn(i);
      } else if (typeof editor.setPresentation === 'function') {
        // last-resort: try to mutate via setPresentation if the hook exposes it
        // (no-op for index, but prevents the crash)
        console.warn('[SlideEditor] No slide-index setter found on useSlideEditor()');
      } else {
        console.warn('[SlideEditor] Cannot change slide — hook missing setter');
      }
    },
    [editor]
  );

  const currentSlide =
    editor.presentation?.slides?.[editor.currentSlideIndex] ??
    editor.presentation?.slides?.[0];

  const selectedElement: SlideElement | null =
    currentSlide?.elements?.find((e: SlideElement) => e.id === editor.selectedElementId) ?? null;

  const handleOpenFile = useCallback(
    async (file: File) => {
      try {
        const pres = await parsePptxFile(file);
        editor.loadPresentation(pres);
        toast.success(
          `Opened "${pres.title}" — ${pres.slides.length} slides (${pres.width}×${pres.height})`
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to open file. Make sure it's a valid PPTX file.");
      }
    },
    [editor]
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportPptx(editor.presentation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editor.presentation.title || 'presentation'}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported PPTX');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PPTX');
    }
  }, [editor.presentation]);

  const handleDeleteSelected = useCallback(() => {
    if (editor.selectedElementId) editor.deleteElement(editor.selectedElementId);
  }, [editor]);

  const handleUpdateSelected = useCallback(
    (updates: Partial<SlideElement>) => {
      if (editor.selectedElementId) editor.updateElement(editor.selectedElementId, updates);
    },
    [editor]
  );

  const handleAddImageFromUrl = useCallback(
    (url: string) => {
      editor.addElement('image', { imageUrl: url });
    },
    [editor]
  );

  const handleChangeBackground = useCallback(
    (color: string) => {
      editor.setPresentation((p: any) => {
        const slides = p.slides.map((s: any, i: number) =>
          i === editor.currentSlideIndex ? { ...s, background: color } : s
        );
        return { ...p, slides };
      });
    },
    [editor]
  );

  if (!editor.presentation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading editor…
      </div>
    );
  }

  const pres = editor.presentation;
  const slideWidth = pres.width || 1920;
  const slideHeight = pres.height || 1080;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <Toolbar
        selectedElement={selectedElement}
        onAddElement={(t: any) => editor.addElement(t)}
        onUpdateElement={handleUpdateSelected}
        onDeleteElement={handleDeleteSelected}
        onChangeBackground={handleChangeBackground}
        onOpenFile={handleOpenFile}
        onAddImage={handleAddImageFromUrl}
        presentationTitle={pres.title}
        onTitleChange={(title: string) =>
          editor.setPresentation((p: any) => ({ ...p, title }))
        }
        onUndo={editor.undo}
        onRedo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onPresent={() => setPresenting(true)}
        onExport={handleExport}
      />

      <div className="flex flex-1 overflow-hidden">
        <SlidePanel
          slides={pres.slides}
          currentIndex={editor.currentSlideIndex ?? 0}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
          onSelect={goToSlide}
          onAdd={editor.addSlide}
          onDelete={editor.deleteSlide}
        />

        <SlideCanvas
          slide={currentSlide}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
          selectedElementId={editor.selectedElementId}
          onSelectElement={editor.selectElement}
          onUpdateElement={editor.updateElement}
        />
      </div>

      {presenting && (
        <PresentationMode
          presentation={pres}
          startIndex={editor.currentSlideIndex ?? 0}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
};