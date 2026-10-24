// Advisor chat component — calls POST /api/advisor, keeps last 12 messages.
// Falls back to null/offline behavior when the backend returns null.

import { useCallback, useRef, useState } from 'react';
import { useConsoleStore } from './store';
import { callAdvisor, isValidAdvisorRequest } from '../services/api';
import type { AdvisorMessage } from './store';
import type { Snapshot } from '../sim/index';

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
    async (e: React.FormEvent) => {
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
    <section className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Process Advisor</h3>
        {advisorLoading && <span className="text-xs text-blue-500 animate-pulse">thinking…</span>}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-2 pr-2">
        {advisorMessages.map((msg) => (
          <div
            key={msg.timestamp}
            className={`max-w-[85%] p-2 rounded-lg rounded-tl-none text-sm ${
              msg.role === 'user'
                ? 'ml-auto bg-blue-100 text-blue-900 rounded-tr-none'
                : 'mr-auto bg-gray-100 text-gray-900 rounded-tl-none'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {advisorAnswer && advisorMessages.length === 0 && (
          <div className="mr-auto bg-gray-100 text-gray-900 text-sm p-2 rounded-lg rounded-tl-none max-w-[85%]">
            {advisorAnswer}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the simulated run…"
          disabled={advisorLoading || !snapshot}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm bg-white disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={advisorLoading || !input.trim() || !snapshot}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Ask
        </button>
      </form>

      {!snapshot && (
        <p className="text-xs text-gray-500 mt-2">Start a simulation run to ask the advisor.</p>
      )}
      {advisorAnswer === null && advisorMessages.length > 0 && !advisorLoading && (
        <p className="text-xs text-orange-500 mt-1">Advisor returned null — using offline fallback.</p>
      )}
    </section>
  );
}
