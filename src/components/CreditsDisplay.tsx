import React from 'react';
import { MessageSquare, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CreditsDisplayProps {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  totalAudioCredits?: number;
  usedAudioCredits?: number;
  remainingAudioCredits?: number;
  trialEndsAt: Date | null;
  isExpired: boolean;
  hasUnlimitedCredits: boolean;
  className?: string;
  compact?: boolean;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  totalCredits,
  usedCredits,
  remainingCredits,
  totalAudioCredits = 14,
  usedAudioCredits = 0,
  remainingAudioCredits = 14,
  trialEndsAt,
  isExpired,
  hasUnlimitedCredits,
  className,
  compact = false,
}) => {
  const navigate = useNavigate();
  
  // Unlimited credits - show premium badge
  if (hasUnlimitedCredits) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Premium Ilimitado</span>
        </div>
      </div>
    );
  }

  const percentage = Math.round((remainingCredits / totalCredits) * 100);
  const audioPercentage = Math.round((remainingAudioCredits / totalAudioCredits) * 100);
  const isLow = remainingCredits <= 10;
  const isCritical = remainingCredits <= 3;
  const isAudioLow = remainingAudioCredits <= 3;
  const isAudioCritical = remainingAudioCredits <= 1;

  const daysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Expired or no credits - show upgrade CTA
  if (isExpired || (remainingCredits === 0 && remainingAudioCredits === 0)) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => navigate('/plans')}
          className="gap-1.5 text-xs h-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isExpired ? 'Trial expirado' : 'Sem créditos'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  // Compact version for header
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
          isCritical ? "bg-destructive/10 text-destructive" : 
          isLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
          "bg-muted text-muted-foreground"
        )}>
          <MessageSquare className="w-3 h-3" />
          <span>{remainingCredits}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
          isAudioCritical ? "bg-destructive/10 text-destructive" : 
          isAudioLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
          "bg-muted text-muted-foreground"
        )}>
          <Mic className="w-3 h-3" />
          <span>{remainingAudioCredits}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Credits counters */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
          isCritical ? "bg-destructive/10 text-destructive" : 
          isLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
          "bg-muted text-foreground"
        )}>
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">{remainingCredits}/{totalCredits}</span>
          <span className="text-xs opacity-70">msgs</span>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
          isAudioCritical ? "bg-destructive/10 text-destructive" : 
          isAudioLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
          "bg-muted text-foreground"
        )}>
          <Mic className="w-4 h-4" />
          <span className="font-medium">{remainingAudioCredits}/{totalAudioCredits}</span>
          <span className="text-xs opacity-70">áudios</span>
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isCritical ? "bg-destructive" : 
                isLow ? "bg-amber-500" : 
                "bg-primary"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isAudioCritical ? "bg-destructive" : 
                isAudioLow ? "bg-amber-500" : 
                "bg-primary"
              )}
              style={{ width: `${audioPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Days remaining or upgrade CTA */}
      {(isCritical || isAudioCritical) ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/plans')}
          className="h-6 px-2 text-xs text-primary hover:text-primary"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Fazer upgrade
        </Button>
      ) : trialEndsAt && daysRemaining > 0 && (
        <p className="text-xs text-muted-foreground">
          {daysRemaining} dias restantes
        </p>
      )}
    </div>
  );
};
