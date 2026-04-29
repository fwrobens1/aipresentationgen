import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
} from 'lucide-react';
import { usePresentations } from '@/context/PresentationContext';
import { SlideRenderer } from '@/components/slides/SlideRenderer';
import { exportToPptx } from '@/lib/exportToPptx';
import { useToast } from '@/hooks/use-toast';

const PresentationView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = usePresentations();
  const presentations = Array.isArray(ctx?.presentations) ? ctx.presentations : [];
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const presentation = presentations.find((p) => p.id === id);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentSlide((i) => Math.min((presentation?.slides.length ?? 1) - 1, i + 1));
      if (e.key === 'ArrowLeft') setCurrentSlide((i) => Math.max(0, i - 1));
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentation, isFullscreen]);

  if (!presentation) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-3">Presentation not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            It may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-medium hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  const slide = presentation.slides[currentSlide];
  const total = presentation.slides.length;
  const prev = () => setCurrentSlide((i) => Math.max(0, i - 1));
  const next = () => setCurrentSlide((i) => Math.min(total - 1, i + 1));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await exportToPptx(presentation);
      toast({ title: 'Download started', description: 'Your .pptx file is on its way.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Export failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-[hsl(var(--editor-bg))] overflow-hidden">
      {/* Top bar */}
      {!isFullscreen && (
        <header className="relative z-20 flex items-center justify-between px-5 py-3 hairline-b glass-strong">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[13.5px] font-medium tracking-tight">
                {presentation.title}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Slide {currentSlide + 1} of {total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-full hairline bg-secondary hover:bg-accent px-3.5 py-2 text-[12.5px] font-medium text-foreground disabled:opacity-50 transition-colors"
            >
              {isExporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {isExporting ? 'Exporting…' : 'Download .pptx'}
            </button>
            <button
  onClick={() => navigate(`/canva/${presentation.id}`)}
  className="inline-flex items-center gap-2 rounded-full hairline bg-secondary hover:bg-accent px-3.5 py-2 text-[12.5px] font-medium text-foreground transition-colors"
>
  Open in Editor
</button>
            <button
              onClick={toggleFullscreen}
              className="grid size-9 place-items-center rounded-full hairline bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Stage */}
      <div className="relative flex-1 grid place-items-center px-6 py-8 overflow-hidden">
        {/* ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 ambient-glow" />

        {/* Prev / Next */}
        {!isFullscreen && (
          <>
            <button
              onClick={prev}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 grid size-11 place-items-center rounded-full glass-strong text-foreground disabled:opacity-30 hover:scale-105 transition-all"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              disabled={currentSlide === total - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 grid size-11 place-items-center rounded-full glass-strong text-foreground disabled:opacity-30 hover:scale-105 transition-all"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Slide canvas */}
        <div className="relative w-full max-w-[1100px] aspect-video">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -8 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0 rounded-2xl overflow-hidden glow border border-border bg-[hsl(var(--editor-slide))]"
            >
              <SlideRenderer slide={slide} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnail strip */}
      {!isFullscreen && (
        <footer className="relative z-10 hairline-t glass-strong px-5 py-3">
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin pb-1">
            {presentation.slides.map((s, i) => (
              <button
                key={s.id ?? i}
                onClick={() => setCurrentSlide(i)}
                className={`relative shrink-0 w-32 aspect-video rounded-lg overflow-hidden border transition-all ${
                  i === currentSlide
                    ? 'border-[hsl(var(--warm-glow))] shadow-[0_0_0_2px_hsl(var(--warm-glow)/0.25)]'
                    : 'border-border hover:border-[hsl(var(--editor-thumb-border))] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="absolute inset-0 bg-[hsl(var(--editor-slide))]">
                  <SlideRenderer slide={s} scale={0.18} />
                </div>
                <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-[hsl(var(--editor-slide-fg))] bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};

export default PresentationView;