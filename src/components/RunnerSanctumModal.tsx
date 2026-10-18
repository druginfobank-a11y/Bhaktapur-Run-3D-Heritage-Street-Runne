import React from 'react';
import { PlayerProfile, RunnerId } from '../types/game';
import { RUNNERS } from '../data/bhaktapurData';
import { Check, Coins, Flame, Magnet, Shield, Sparkles, UserCheck, X } from 'lucide-react';

interface RunnerSanctumModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onSelectOrUnlockRunner: (runnerId: RunnerId) => void;
  onUpgradeRelic: (relic: 'magnetLevel' | 'shieldLevel' | 'surgeLevel') => void;
}

export const RunnerSanctumModal: React.FC<RunnerSanctumModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectOrUnlockRunner,
  onUpgradeRelic,
}) => {
  if (!isOpen) return null;

  const relicConfigs = [
    {
      key: 'magnetLevel' as const,
      name: 'Sukunda Lamp Magnet',
      subtitle: 'Pulls nearby Malla Coins across all 3 brick street lanes',
      icon: Magnet,
      level: profile.upgrades.magnetLevel,
      baseCost: 80,
    },
    {
      key: 'shieldLevel' as const,
      name: 'Garuda Aura Shield',
      subtitle: 'Absorbs collisions with chariots, stone guardians, and fire traps',
      icon: Shield,
      level: profile.upgrades.shieldLevel,
      baseCost: 100,
    },
    {
      key: 'surgeLevel' as const,
      name: 'Juju Dhau King Surge',
      subtitle: 'Extends high-speed invincible sprint duration when meter hits 100%',
      icon: Flame,
      level: profile.upgrades.surgeLevel,
      baseCost: 120,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#120F16] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-100">
              Nyatapola Runner Sanctum &amp; Relics
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Recruit Bhaktapur heritage runners and forge sacred Malla power-ups
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono-tabular text-sm font-semibold">
              <Coins className="w-4 h-4" />
              <span>{profile.totalCoins} Malla Coins</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors"
              aria-label="Close Runner Sanctum"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Unlockable Runners Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-200">
              01. Playable Heritage Runners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {RUNNERS.map((runner) => {
                const isUnlocked = profile.unlockedRunners.includes(runner.id);
                const isSelected = profile.selectedRunner === runner.id;
                const canAfford = profile.totalCoins >= runner.cost;

                return (
                  <div
                    key={runner.id}
                    className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#D94E28]/15 border-[#D94E28]'
                        : 'bg-stone-900/70 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-sm shrink-0 border border-white/20"
                            style={{
                              backgroundColor: `#${runner.primaryColor
                                .toString(16)
                                .padStart(6, '0')}`,
                            }}
                          />
                          <h4 className="font-display text-base font-bold text-stone-100">
                            {runner.name}
                          </h4>
                        </div>
                        <span className="text-xs text-amber-400/90 font-medium">
                          {runner.title}
                        </span>
                      </div>

                      <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                        {runner.description}
                      </p>

                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="flex items-center gap-2 text-[11px] text-stone-300 mt-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{runner.perkLabel}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-xs text-stone-400 font-mono-tabular">
                        Speed {Math.round(runner.speedBonus * 100)}% · Coins{' '}
                        {runner.coinMultiplier}x
                      </span>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <Check className="w-4 h-4" />
                          Selected Runner
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onSelectOrUnlockRunner(runner.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Equip Runner</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onSelectOrUnlockRunner(runner.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap font-mono-tabular"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Unlock ({runner.cost})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sacred Relic Power-Up Upgrades */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-200">
              02. Sacred Relic Upgrades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {relicConfigs.map((relic) => {
                const Icon = relic.icon;
                const isMax = relic.level >= 5;
                const cost = relic.baseCost * relic.level;
                const canAfford = profile.totalCoins >= cost && !isMax;

                return (
                  <div
                    key={relic.key}
                    className="p-4 rounded-xl bg-stone-900/70 border border-stone-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                          <h4 className="text-sm font-semibold text-stone-100">
                            {relic.name}
                          </h4>
                        </div>
                        <span className="font-mono-tabular text-xs text-[#06B6D4]">
                          Lv. {relic.level}/5
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1.5">
                        {relic.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onUpgradeRelic(relic.key)}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition-colors font-mono-tabular whitespace-nowrap"
                    >
                      {isMax ? (
                        <span>Max Mastery Reached</span>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>Upgrade ({cost} Coins)</span>
                        </>
                      )}
                    </button>
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
