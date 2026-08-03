import { ProgressRing } from '../components/ProgressRing';
import { QuickAddButtons } from '../components/QuickAddButtons';
import { StreakFlame } from '../components/StreakFlame';
import { Settings, TodayCache, StreakState } from '../../lib/types';

interface TodayViewProps {
  settings: Settings;
  todayCache: TodayCache;
  streak: StreakState;
  onLogged: () => void;
}

export function TodayView({ settings, todayCache, streak, onLogged }: TodayViewProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ProgressRing totalMl={todayCache.totalMl} goalMl={settings.dailyGoalMl} />
      </div>
      <StreakFlame currentStreak={streak.currentStreak} />
      <QuickAddButtons onLogged={onLogged} />
    </div>
  );
}
