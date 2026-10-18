import React from 'react';
import { DailyMission, ExtractedRoute, PlayerProfile } from '../types/game';
import { DAILY_MISSIONS, HERITAGE_RELICS, INITIAL_EXTRACTED_ROUTES } from '../data/bhaktapurData';
import {
  Award,
  Bell,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Milestone,
  Navigation,
  Play,
  Scroll,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  activeRoute: ExtractedRoute;
  onSelectRoute: (route: ExtractedRoute) => void;
  onStartMissionRun: (route: ExtractedRoute) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeRoute,
  onSelectRoute,
  onStartMissionRun,
}) => {
  if (!isOpen) return null;

  const relicsList = Object.values(HERITAGE_RELICS);

  const renderRelicIcon = (iconName: string) => {
    switch (iconName) {
      case 'PEACOCK_WINDOW':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'TALEJU_BELL':
        return <Bell className="w-5 h-5 text-amber-400" />;
      case 'KING_CHALICE':
        return <Flame className="w-5 h-5 text-amber-400" />;
      default:
        return <Scroll className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#120F16] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="font-display text-xl font-bold text-stone-100">
                Daily Heritage Missions &amp; Relic Vault
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Complete historic Bhaktapur street routes daily to earn exclusive Malla Heritage Relics
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors"
            aria-label="Close Daily Missions Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Daily Missions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Active Daily Street Missions</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono-tabular">
                Resets Daily at Midnight
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {DAILY_MISSIONS.map((mission) => {
                const isCompleted = profile.dailyMissionsCompleted.includes(
                  mission.id
                );
                const targetRoute =
                  INITIAL_EXTRACTED_ROUTES.find(
                    (r) => r.id === mission.routeId
                  ) || INITIAL_EXTRACTED_ROUTES[0];

                return (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-stone-900/70 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-amber-400">
                          {mission.rewardCoins} Malla Coins
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </div>

                      <h4 className="font-display text-sm font-bold text-stone-100 mt-1">
                        {mission.title}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {mission.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-300">
                        <Milestone className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                        <span>
                          {mission.targetDistanceMeters}m Street Distance ·{' '}
                          {mission.targetJujuDhau} Juju Dhau Bowls
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800/80 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
                        {renderRelicIcon(mission.rewardRelic.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-amber-300 truncate">
                          {mission.rewardRelic.name}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {mission.rewardRelic.perkDescription}
                        </div>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoute(targetRoute);
                          onStartMissionRun(targetRoute);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#D94E28] hover:bg-[#ea580c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Daily Mission Route</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heritage Relic Vault Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Heritage Relic Vault ({profile.earnedRelics.length}/4 Relics Collected)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {relicsList.map((relic) => {
                const isEarned = profile.earnedRelics.includes(relic.id);

                return (
                  <div
                    key={relic.id}
                    className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
                      isEarned
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-stone-900/40 border-stone-800/60 opacity-60'
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 shrink-0 text-amber-400 shadow-inner">
                      {renderRelicIcon(relic.iconName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-stone-100 truncate">
                          {relic.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-amber-400 shrink-0">
                          {isEarned ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 italic mt-0.5">
                        {relic.newaName}
                      </p>
                      <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                        {relic.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-stone-800/80 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Buff: {relic.perkDescription}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CalendarBadge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
    </svg>
  );
}
