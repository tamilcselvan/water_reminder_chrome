import { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useHydroState } from './useHydroState';
import { TodayView } from './views/TodayView';
import { StatsView } from './views/StatsView';
import { AchievementsView } from './views/AchievementsView';

type Tab = 'today' | 'stats' | 'achievements';
const TABS: Tab[] = ['today', 'stats', 'achievements'];

export function Popup() {
  const [tab, setTab] = useState<Tab>('today');
  const hydro = useHydroState();

  return (
    <MotionConfig reducedMotion="user">
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
              <TodayView
                settings={hydro.settings}
                todayCache={hydro.todayCache}
                streak={hydro.streak}
                onLogged={hydro.refresh}
              />
            )}
            {tab === 'stats' && <StatsView />}
            {tab === 'achievements' && <AchievementsView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
