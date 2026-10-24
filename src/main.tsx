import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// No <StrictMode>: it double-invokes effects in dev, which would spawn duplicate
// simulation / requestAnimationFrame loops once the run loop is wired (Phase 5).
const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('AEROBE: #root mount point missing');
}

createRoot(rootEl).render(<App />);
