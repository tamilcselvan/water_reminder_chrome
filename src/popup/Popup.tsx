import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHydroState } from './useHydroState';

type Tab = 'today' | 'stats' | 'achievements';
const TABS: Tab[] = ['today', 'stats', 'achievements'];

export function Popup() {
  const [tab, setTab] = useState<Tab>('today');
  const hydro = useHydroState();

  return (
    <div>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab-button${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'today' && (
            <div className="card">
              <em>Today view lands in Task 11</em>
              <p>{hydro.loading ? 'Loading…' : `${hydro.todayCache.totalMl}ml logged today`}</p>
            </div>
          )}
          {tab === 'stats' && <div className="card"><em>Stats view lands in Task 12</em></div>}
          {tab === 'achievements' && <div className="card"><em>Achievements view lands in Task 13</em></div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
