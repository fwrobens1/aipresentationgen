import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, FolderOpen } from 'lucide-react';
import { usePresentations } from '@/context/PresentationContext';
import { ProjectCard } from '@/components/projects/ProjectCard';

const Projects = () => {
  const navigate = useNavigate();
  const { presentations, deletePresentation } = usePresentations();

  return (
    <div className="relative w-full h-full overflow-y-auto bg-background">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 ambient-glow opacity-50" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between mb-12 flex-wrap gap-4"
        >
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Library
            </p>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight gradient-text">
              Your decks
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              {presentations.length > 0
                ? `${presentations.length} presentation${presentations.length === 1 ? '' : 's'} crafted with SlideAI`
                : 'Every story you create lives here.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition-opacity inset-highlight"
          >
            <Plus className="size-4" />
            New presentation
          </button>
        </motion.div>

        {presentations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl hairline bg-card/40 backdrop-blur-sm py-24 px-6 text-center"
          >
            <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-secondary border border-border">
              <FolderOpen className="size-6 text-muted-foreground" />
            </div>
            <h2 className="font-display text-3xl tracking-tight mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
              Start a conversation to generate your first AI-powered presentation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="size-3.5" />
              Create your first deck
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {presentations.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <ProjectCard presentation={p} onDelete={deletePresentation} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;