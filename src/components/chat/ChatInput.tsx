import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Paperclip, Presentation, ImagePlus, Wand2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

const chips = [
  { icon: Presentation, label: 'Generate slides', prefix: 'Create a presentation about ' },
  { icon: ImagePlus,    label: 'With imagery',    prefix: 'Create a visual presentation with images about ' },
  { icon: Wand2,        label: 'Refine deck',     prefix: 'Edit the current presentation: ' },
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  };

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Composer shell */}
      <div
        className={`relative rounded-3xl glass-strong transition-all duration-300 ${
          focused ? 'glow' : 'glow-sm'
        }`}
      >
        {/* warm halo when focused */}
        <div
          className={`pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-500 ${
            focused ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'linear-gradient(135deg, hsl(35 30% 55% / 0.25), transparent 40%, hsl(35 30% 55% / 0.15))',
            mask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
            WebkitMask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: 1,
          }}
        />

        <div className="relative px-4 pt-4 pb-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe the presentation you want to create…"
            rows={3}
            className="w-full resize-none bg-transparent focus:outline-none outline-none text-foreground placeholder:text-muted-foreground/70 text-[14.5px] leading-relaxed max-h-[220px]"
          />

          {/* Action row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Paperclip className="size-4" />
              </button>

              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                {chips.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      setInput(c.prefix);
                      textareaRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full hairline bg-secondary/60 hover:bg-accent px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-all"
                  >
                    <c.icon className="size-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={submit}
              disabled={!input.trim() || isLoading}
              className="grid size-9 place-items-center rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:scale-105 transition-all inset-highlight"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
        SlideAI can make mistakes. Review your presentations before sharing.
      </p>
    </motion.div>
  );
}