// Zustand store for console UI state (controls, snapshots, alarms, advisor status).
// Person 2 owns src/console/** per 03_ARCHITECTURE.md §4.

import { create, type StateCreator } from 'zustand';
import type { Snapshot } from '../sim/index';

export interface ConsoleControls {
  Tset: number;
  pHset: number;
  rpm: number;
  vvm: number;
  feed: number;
}

export const DEFAULT_CONTROLS: ConsoleControls = {
  Tset: 37,
  pHset: 7.0,
  rpm: 400,
  vvm: 1.0,
  feed: 0,
};

export interface AdvisorMessage {
  role: 'user' | 'advisor';
  content: string;
  timestamp: number;
}

export interface ConsoleState {
  controls: ConsoleControls;
  organism: 'ecoli' | 'yeast';
  snapshot: Snapshot | null;
  history: Snapshot[];
  alarms: string[];
  advisorMessages: AdvisorMessage[];
  advisorLoading: boolean;
  advisorAnswer: string | null;
  plan: { Tset: number; pHset: number; rpm: number; vvm: number; feed: number; reason?: string } | null;
  planLoading: boolean;
  liteMode: boolean;
  reducedMotion: boolean;

  setControls: (partial: Partial<ConsoleControls>) => void;
  setControl: (key: keyof ConsoleControls, value: number) => void;
  setOrganism: (org: 'ecoli' | 'yeast') => void;
  setSnapshot: (snap: Snapshot | null) => void;
  addHistory: (snap: Snapshot) => void;
  clearHistory: () => void;
  addAlarm: (id: string) => void;
  clearAlarms: () => void;
  addAdvisorMessage: (msg: AdvisorMessage) => void;
  setAdvisorMessages: (msgs: AdvisorMessage[]) => void;
  setAdvisorLoading: (loading: boolean) => void;
  setAdvisorAnswer: (answer: string | null) => void;
  setPlan: (plan: ConsoleState['plan']) => void;
  setPlanLoading: (loading: boolean) => void;
  setLiteMode: (lite: boolean) => void;
  setReducedMotion: (motion: boolean) => void;
  reset: () => void;
}

const storeCreator: StateCreator<ConsoleState> = (set) => ({
  controls: { ...DEFAULT_CONTROLS },
  organism: 'ecoli',
  snapshot: null,
  history: [],
  alarms: [],
  advisorMessages: [],
  advisorLoading: false,
  advisorAnswer: null,
  plan: null,
  planLoading: false,
  liteMode: false,
  reducedMotion: false,

  setControls: (partial: Partial<ConsoleControls>) =>
    set((state) => ({ controls: { ...state.controls, ...partial } })),
  setControl: (key: keyof ConsoleControls, value: number) =>
    set((state) => ({ controls: { ...state.controls, [key]: value } })),
  setOrganism: (org: 'ecoli' | 'yeast') => set({ organism: org }),
  setSnapshot: (snap: Snapshot | null) => set({ snapshot: snap }),
  addHistory: (snap: Snapshot) =>
    set((state) => ({ history: [...state.history, snap] })),
  clearHistory: () => set({ history: [] }),
  addAlarm: (id: string) =>
    set((state) => ({ alarms: [...state.alarms, id] })),
  clearAlarms: () => set({ alarms: [] }),
  addAdvisorMessage: (msg: AdvisorMessage) =>
    set((state) => ({ advisorMessages: [...state.advisorMessages, msg] })),
  setAdvisorMessages: (msgs: AdvisorMessage[]) => set({ advisorMessages: msgs }),
  setAdvisorLoading: (loading: boolean) => set({ advisorLoading: loading }),
  setAdvisorAnswer: (answer: string | null) => set({ advisorAnswer: answer }),
  setPlan: (plan: ConsoleState['plan']) => set({ plan }),
  setPlanLoading: (loading: boolean) => set({ planLoading: loading }),
  setLiteMode: (lite: boolean) => set({ liteMode: lite }),
  setReducedMotion: (motion: boolean) => set({ reducedMotion: motion }),
  reset: () =>
    set({
      controls: { ...DEFAULT_CONTROLS },
      snapshot: null,
      history: [],
      alarms: [],
      advisorMessages: [],
      advisorAnswer: null,
      plan: null,
    }),
});

export const useConsoleStore = create<ConsoleState>(storeCreator);
