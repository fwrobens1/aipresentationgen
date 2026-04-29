// Drop-in replacement for src/components/projects/ProjectCard.tsx
// Adjust the import paths if your types/components live elsewhere.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Trash2, ArrowUpRight } from 'lucide-react';
import { SlideRenderer } from '@/components/slides/SlideRenderer';
import type { Presentation } from '@/types/presentation';

interface Props {
  presentation: Presentation;
  onDelete: (id: string) => void;
}

export function ProjectCard({ presentation, onDelete }: Props) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const updated = new Date(presentation.updatedAt ?? presentation.createdAt ?? Date.now());
  const relative = formatRelative(updated);

  return (
    <article
      onClick={() => navigate(`/presentation/${presentation.id}`)}
      className="group relative cursor-pointer rounded-2xl bg-card border border-border overflow-hidden card-hover"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-background/60 hairline-b overflow-hidden">
        <div className="absolute inset-0 grid place-items-center">
          <SlideRenderer slide={presentation.slides[0]} scale={0.4} />
        </div>
        {/* hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-foreground text-background opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          <ArrowUpRight className="size-3.5" />
        </div>
      </div>

      {/* Meta */}
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13.5px] font-medium tracking-tight text-foreground">
            {presentation.title}
          </h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {presentation.slides.length} slides · {relative}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-8 z-20 w-40 rounded-xl glass-strong p-1 shadow-2xl animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(presentation.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-destructive hover:bg-accent transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function formatRelative(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}