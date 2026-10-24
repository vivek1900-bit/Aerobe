import { Console } from './console/Console';

// App shell — renders the console directly for now.
// Preloader → Nav → Story intro and skip/replay transitions land in later phases (04 §1, §5).
export default function App() {
  return <Console />;
}
