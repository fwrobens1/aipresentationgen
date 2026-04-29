import { useState, useCallback, useRef } from 'react';
import {
  Presentation,
  Slide,
  SlideElement,
  createDefaultPresentation,
  createDefaultSlide,
  createDefaultElement,
} from '@/types/slide';

const MAX_HISTORY = 50;

export function useSlideEditor() {
  const [presentation, setPresentation] = useState<Presentation>(createDefaultPresentation());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo/Redo
  const historyRef = useRef<Presentation[]>([]);
  const futureRef = useRef<Presentation[]>([]);

  const pushHistory = useCallback((prev: Presentation) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), prev];
    futureRef.current = [];
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setPresentation((current) => {
      futureRef.current = [...futureRef.current, current];
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    setPresentation((current) => {
      historyRef.current = [...historyRef.current, current];
      return next;
    });
  }, []);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const currentSlide = presentation.slides[currentSlideIndex] || presentation.slides[0];

  const selectedElement = selectedElementId
    ? currentSlide?.elements.find((el) => el.id === selectedElementId) || null
    : null;

  const updateSlide = useCallback(
    (slideIndex: number, updater: (slide: Slide) => Slide) => {
      setPresentation((prev) => {
        pushHistory(prev);
        return {
          ...prev,
          slides: prev.slides.map((s, i) => (i === slideIndex ? updater(s) : s)),
        };
      });
    },
    [pushHistory]
  );

  const addElement = useCallback(
    (type: SlideElement['type']) => {
      const el = createDefaultElement(type, 200 + Math.random() * 200, 200 + Math.random() * 200);
      updateSlide(currentSlideIndex, (s) => ({
        ...s,
        elements: [...s.elements, el],
      }));
      setSelectedElementId(el.id);
    },
    [currentSlideIndex, updateSlide]
  );

  const updateElement = useCallback(
    (elementId: string, updates: Partial<SlideElement>) => {
      updateSlide(currentSlideIndex, (s) => ({
        ...s,
        elements: s.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      }));
    },
    [currentSlideIndex, updateSlide]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      updateSlide(currentSlideIndex, (s) => ({
        ...s,
        elements: s.elements.filter((el) => el.id !== elementId),
      }));
      if (selectedElementId === elementId) setSelectedElementId(null);
    },
    [currentSlideIndex, updateSlide, selectedElementId]
  );

  const addSlide = useCallback(() => {
    setPresentation((prev) => {
      pushHistory(prev);
      return {
        ...prev,
        slides: [...prev.slides, createDefaultSlide()],
      };
    });
    setCurrentSlideIndex(presentation.slides.length);
    setSelectedElementId(null);
  }, [presentation.slides.length, pushHistory]);

  const deleteSlide = useCallback(
    (index: number) => {
      if (presentation.slides.length <= 1) return;
      setPresentation((prev) => {
        pushHistory(prev);
        return {
          ...prev,
          slides: prev.slides.filter((_, i) => i !== index),
        };
      });
      if (currentSlideIndex >= index && currentSlideIndex > 0) {
        setCurrentSlideIndex((prev) => prev - 1);
      }
      setSelectedElementId(null);
    },
    [presentation.slides.length, currentSlideIndex, pushHistory]
  );

  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
    setSelectedElementId(null);
  }, []);

  const updateSlideBackground = useCallback(
    (color: string) => {
      updateSlide(currentSlideIndex, (s) => ({ ...s, background: color }));
    },
    [currentSlideIndex, updateSlide]
  );

  const loadPresentation = useCallback((pres: Presentation) => {
    setPresentation((prev) => {
      pushHistory(prev);
      return pres;
    });
    setCurrentSlideIndex(0);
    setSelectedElementId(null);
  }, [pushHistory]);

  const addImageElement = useCallback(
    (imageUrl: string) => {
      const el = createDefaultElement('image', 200, 200);
      el.imageUrl = imageUrl;
      updateSlide(currentSlideIndex, (s) => ({
        ...s,
        elements: [...s.elements, el],
      }));
      setSelectedElementId(el.id);
    },
    [currentSlideIndex, updateSlide]
  );

  return {
    presentation,
    currentSlide,
    currentSlideIndex,
    selectedElementId,
    selectedElement,
    setSelectedElementId,
    addElement,
    updateElement,
    deleteElement,
    addSlide,
    deleteSlide,
    goToSlide,
    updateSlideBackground,
    loadPresentation,
    addImageElement,
    setPresentation,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}