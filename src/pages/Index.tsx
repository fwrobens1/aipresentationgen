import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, ArrowUpRight, Loader2 } from 'lucide-react';
import { ChatInput } from '@/components/chat/ChatInput';
import { GradientOrb } from '@/components/chat/GradientOrb';
import { SlideRenderer } from '@/components/slides/SlideRenderer';
import { usePresentations } from '@/context/PresentationContext';
import { generatePresentation } from '@/lib/generateSlides';
import { ChatMessage } from '@/types/presentation';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentConversationId,
    getCurrentConversation,
    createConversation,
    addMessage,
    addPresentation,
    linkPresentation,
  } = usePresentations();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = getCurrentConversation();
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (input: string) => {
    let convId = currentConversationId;
    if (!convId) convId = createConversation();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    addMessage(convId, userMsg);
    setIsLoading(true);

    try {
      const { presentation, message } = await generatePresentation(input);
      addPresentation(presentation);
      linkPresentation(convId, presentation.id);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message,
        presentation,
        timestamp: new Date().toISOString(),
      };
      addMessage(convId, assistantMsg);
    } catch (err: any) {
      const errorMessage = err?.message || 'Something went wrong. Please try again.';
      toast({ title: 'Generation failed', description: errorMessage, variant: 'destructive' });
      addMessage(convId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I couldn't generate that presentation. ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative flex h-full min-h-screen flex-col bg-background">
      {/* Ambient layered glows */}
      <div className="pointer-events-none absolute inset-0 ambient-glow" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-[0.07] blur-3xl bg-[hsl(35_40%_60%)]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 hairline-b">
        <div className="hidden md:flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-md bg-foreground text-background">
            <Sparkles className="size-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-medium tracking-tight">SlideAI</span>
        </div>
        <div className="flex-1" />
        <button className="grid size-9 place-items-center rounded-full bg-secondary hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all">
          <User className="size-4" />
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6 -mt-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-center max-w-2xl"
            >
              {/* Tiny eyebrow tag */}
              <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 mb-8 text-[11px] tracking-wide uppercase text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[hsl(var(--warm-glow))] animate-pulse-glow" />
                AI presentation studio
              </div>

              <p className="text-sm text-muted-foreground mb-3 font-light">{getGreeting()}</p>

              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] gradient-text">
                What will you<br />
                <em className="not-italic text-muted-foreground/80">present today?</em>
              </h1>

              <p className="mt-4 md:mt-6 text-sm md:text-[14px] leading-relaxed text-muted-foreground max-w-md mx-auto">
                Describe your topic and SlideAI will craft a polished deck — complete with imagery — in seconds.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`shrink-0 grid size-8 place-items-center rounded-full ${
                        msg.role === 'assistant'
                          ? 'bg-foreground text-background'
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <Sparkles className="size-3.5" strokeWidth={2.5} />
                      ) : (
                        <User className="size-3.5" />
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`inline-block max-w-full rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-secondary text-foreground border border-border'
                            : 'text-foreground/90'
                        }`}
                      >
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} className={i > 0 ? 'mt-2' : ''}>
                            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                          </p>
                        ))}
                      </div>

                      {msg.presentation && (
                        <button
                          onClick={() => navigate(`/presentation/${msg.presentation!.id}`)}
                          className="group mt-3 block w-full max-w-md rounded-2xl bg-card border border-border overflow-hidden card-hover text-left"
                        >
                          <div className="aspect-video bg-background/60 hairline-b grid place-items-center">
                            <SlideRenderer slide={msg.presentation.slides[0]} scale={0.35} />
                          </div>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-[13px] font-medium">{msg.presentation.title}</h3>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {msg.presentation.slides.length} slides
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                              Open
                              <ArrowUpRight className="size-3.5" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex gap-3">
                  <div className="shrink-0 grid size-8 place-items-center rounded-full bg-foreground text-background">
                    <Loader2 className="size-3.5 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3">
                    <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="relative px-4 md:px-6 pb-8 pt-4">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Index;