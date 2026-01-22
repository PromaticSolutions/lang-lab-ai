import React from 'react';
import { Achievement, tierColors } from '@/data/achievements';
import { Lock } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement & { unlocked: boolean; unlockedAt?: Date };
  compact?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, compact }) => {
  const colors = tierColors[achievement.tier];
  
  if (compact) {
    return (
      <div 
        className={`relative w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
          achievement.unlocked 
            ? `${colors.bg} ${colors.border}` 
            : 'bg-muted/50 border-muted-foreground/20 opacity-50'
        }`}
        title={achievement.unlocked ? achievement.name : `🔒 ${achievement.name}`}
      >
        {achievement.unlocked ? (
          <span className="text-xl">{achievement.icon}</span>
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all ${
        achievement.unlocked 
          ? `${colors.bg} ${colors.border}` 
          : 'bg-muted/30 border-muted-foreground/20'
      }`}
    >
      {!achievement.unlocked && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          achievement.unlocked ? colors.bg : 'bg-muted'
        }`}>
          {achievement.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${achievement.unlocked ? colors.text : 'text-muted-foreground'}`}>
            {achievement.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Desbloqueado em {achievement.unlockedAt.toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
          {achievement.tier}
        </div>
      </div>
    </div>
  );
};
