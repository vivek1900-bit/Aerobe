// 3D console reactor viewport — mounts the Console zip's vessel, gated to run state.
import { useEffect, useRef } from 'react';
import { ConsoleReactor } from '../scene/ConsoleReactor';
import { useConsoleStore } from './store';

export function ReactorViewport({
  running,
  xray,
  fault,
}: {
  running: boolean;
  xray: boolean;
  fault: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactorRef = useRef<ConsoleReactor | null>(null);
  const rpm = useConsoleStore((s) => s.controls.rpm);
  const vvm = useConsoleStore((s) => s.controls.vvm);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let reactor: ConsoleReactor | null = null;
    try {
      reactor = new ConsoleReactor(el, { running: false });
      reactor.start();
      reactorRef.current = reactor;
    } catch (err) {
      console.error('[AEROBE] WebGL unavailable — 3D twin disabled', err);
    }
    return () => {
      reactor?.dispose();
      reactorRef.current = null;
    };
  }, []);

  useEffect(() => reactorRef.current?.setRunning(running), [running]);
  useEffect(() => reactorRef.current?.setRpm(rpm), [rpm]);
  useEffect(() => reactorRef.current?.setVvm(vvm), [vvm]);
  useEffect(() => reactorRef.current?.setXRay(xray), [xray]);
  useEffect(() => reactorRef.current?.setFault(fault), [fault]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
