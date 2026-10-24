// Advisor chat component — calls POST /api/advisor, keeps last 12 messages.
// Falls back to null/offline behavior when the backend returns null.
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useConsoleStore } from './store';
import { callAdvisor, isValidAdvisorRequest } from '../services/api';
import type { AdvisorMessage } from './store';
import type { Snapshot } from '../sim/index';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';

interface AdvisorChatProps {
  snapshot: Snapshot | null;
}

export function AdvisorChat({ snapshot }: AdvisorChatProps) {
  const {
    advisorMessages,
    advisorLoading,
    advisorAnswer,
    setAdvisorLoading,
    setAdvisorAnswer,
    addAdvisorMessage,
  } = useConsoleStore();

  const [input, setInput] = useState('');
  const messagesRef = useRef<AdvisorMessage[]>(advisorMessages);

  const recent = messagesRef.current
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const question = input.trim();
      if (!question || !snapshot) return;

      setAdvisorLoading(true);
      setAdvisorAnswer(null);

      const userMsg: AdvisorMessage = { role: 'user', content: question, timestamp: Date.now() };
      addAdvisorMessage(userMsg);
      messagesRef.current = [...messagesRef.current, userMsg];

      const body = {
        question,
        organism: 'ecoli',
        snapshot,
        recent,
      };

      if (!isValidAdvisorRequest(body)) {
        setAdvisorLoading(false);
        setAdvisorAnswer(null);
        return;
      }

      try {
        const res = await callAdvisor(body);
        const answer = res.answer ?? null;
        setAdvisorAnswer(answer);

        const advisorMsg: AdvisorMessage = {
          role: 'advisor',
          content: answer ?? 'Advisor unavailable. Using offline fallback.',
          timestamp: Date.now(),
        };
        addAdvisorMessage(advisorMsg);
        messagesRef.current = [...messagesRef.current, advisorMsg];
      } finally {
        setAdvisorLoading(false);
      }
    },
    [input, snapshot, addAdvisorMessage, setAdvisorLoading, setAdvisorAnswer]
  );

  return (
    <Panel title="Process Advisor" index="05">
      <div className="flex flex-col">
        {advisorLoading && (
          <p className="mb-2 animate-pulse font-mono text-[11px] uppercase tracking-label text-signal">
            thinking…
          </p>
        )}

        <div className="h-48 space-y-2 overflow-y-auto pr-1">
          {advisorMessages.map((msg) => (
            <div
              key={msg.timestamp}
              className={`max-w-[85%] border p-2 text-sm ${
                msg.role === 'user'
                  ? 'ml-auto border-signal/40 bg-signal/10 text-text'
                  : 'mr-auto border-line bg-panel2 text-text'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {advisorAnswer && advisorMessages.length === 0 && (
            <div className="mr-auto max-w-[85%] border border-line bg-panel2 p-2 text-sm text-text">
              {advisorAnswer}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the simulated run…"
            disabled={advisorLoading || !snapshot}
            className="h-10 min-w-0 flex-1 border border-line bg-panel2 px-3 text-sm text-text outline-none placeholder:text-muted focus:border-signal disabled:opacity-40"
          />
          <Button type="submit" disabled={advisorLoading || !input.trim() || !snapshot}>
            Ask
          </Button>
        </form>

        {!snapshot && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-muted">
            Start a run to ask the advisor.
          </p>
        )}
        {advisorAnswer === null && advisorMessages.length > 0 && !advisorLoading && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-warn">
            Advisor offline — using fallback.
          </p>
        )}
      </div>
    </Panel>
  );
}
