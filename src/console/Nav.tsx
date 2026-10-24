// Top navigation bar (04 §2, console mode). Fixed, dark, mono uppercase labels.
import { RotateCcw, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-ink px-4 sm:px-6">
      <a href="#console" className="flex items-baseline gap-2">
        <span className="font-display text-xl uppercase tracking-label text-text">AEROBE</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-label text-muted md:inline">
          bioreactor console
        </span>
      </a>

      <nav aria-label="Console sections" className="hidden items-center gap-8 md:flex">
        <a href="#console" aria-current="page" className="font-mono text-xs uppercase tracking-label text-signal">
          Console
        </a>
        <a
          href="#report"
          className="font-mono text-xs uppercase tracking-label text-muted transition-colors hover:text-text"
        >
          Report
        </a>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" className="hidden sm:inline-flex" title="Replay the introduction">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Replay tour
        </Button>
        <Button variant="ghost" aria-label="Settings" title="Settings">
          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
