import { useCallback, useState } from 'react';
import { Console } from './console/Console';
import { Tour } from './story/Tour';

// App shell — Scrollytelling Tour (intro) → Console, with skip/replay (04 §1, §5).
export default function App() {
  const [view, setView] = useState<'tour' | 'console'>('tour');

  const openConsole = useCallback(() => {
    setView('console');
    window.scrollTo(0, 0);
  }, []);

  const replayTour = useCallback(() => {
    setView('tour');
    window.scrollTo(0, 0);
  }, []);

  return view === 'console' ? <Console onReplay={replayTour} /> : <Tour onLaunch={openConsole} />;
}
