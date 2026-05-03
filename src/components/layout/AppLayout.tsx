import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome as Home, FolderOpen, PanelLeftClose, PanelLeft, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { usePresentations } from '@/context/PresentationContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: FolderOpen, label: 'Projects', path: '/projects' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { conversations, currentConversationId, setCurrentConversation, createConversation } = usePresentations();

  const handleNewChat = () => {
    createConversation();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 h-full w-80 border-r border-border flex flex-col bg-sidebar overflow-hidden z-40 md:static md:z-auto"
            >
            <div className="flex items-center justify-between p-4 pb-2">
              <Link to="/" className="flex items-center gap-2 group" onClick={() => setCurrentConversation(null)}>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-sm">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-lg text-foreground">SlideAI</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <nav className="px-3 py-2 space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => item.path === '/' && setCurrentConversation(null)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {conversations.length > 0 && (
              <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-border mt-2">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent
                </p>
                <div className="space-y-0.5">
                  {conversations.slice(0, 20).map(conv => (
                    <Link
                      key={conv.id}
                      to="/"
                      onClick={() => setCurrentConversation(conv.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                        currentConversationId === conv.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{conv.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 border-t border-border flex items-center justify-between">
              <ThemeToggle />
              <span className="text-xs text-muted-foreground">Powered by Gemini</span>
            </div>
            </motion.aside>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors md:hidden"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <motion.div
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
