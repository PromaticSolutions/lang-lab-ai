import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Language, Level, WeeklyGoal } from '@/types';
import { Check, Globe, Target, Calendar, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getLanguageFamily } from '@/locales';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateUserProfile, setHasCompletedOnboarding, authUserId } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [selectedLevel, setSelectedLevel] = useState<Level>('basic');
  const [selectedGoal, setSelectedGoal] = useState<WeeklyGoal>(5);
  const [isSaving, setIsSaving] = useState(false);

  // Get UI language family to determine which languages to show
  const uiLanguage = getLanguageFamily();

  // Languages available - for Europeans, add Portuguese as an option
  const languages = [
    { id: 'english', name: t('onboarding.languages.english'), flag: '🇺🇸' },
    { id: 'spanish', name: t('onboarding.languages.spanish'), flag: '🇪🇸' },
    { id: 'french', name: t('onboarding.languages.french'), flag: '🇫🇷' },
    { id: 'italian', name: t('onboarding.languages.italian'), flag: '🇮🇹' },
    { id: 'german', name: t('onboarding.languages.german'), flag: '🇩🇪' },
    // Show Portuguese for European users (non-Portuguese speakers)
    ...(uiLanguage === 'en' ? [{ id: 'portuguese', name: t('onboarding.languages.portuguese'), flag: '🇧🇷' }] : []),
  ];

  const levels = [
    { id: 'basic', name: t('onboarding.levels.basic'), description: t('onboarding.levels.basicDesc'), adaptiveLevel: 'A1' },
    { id: 'intermediate', name: t('onboarding.levels.intermediate'), description: t('onboarding.levels.intermediateDesc'), adaptiveLevel: 'B1' },
    { id: 'advanced', name: t('onboarding.levels.advanced'), description: t('onboarding.levels.advancedDesc'), adaptiveLevel: 'C1' },
  ];

  const goals = [
    { id: 2, name: t('onboarding.goals.2'), description: t('onboarding.goals.2Desc') },
    { id: 5, name: t('onboarding.goals.5'), description: t('onboarding.goals.5Desc') },
    { id: 10, name: t('onboarding.goals.10'), description: t('onboarding.goals.10Desc') },
  ];

  useEffect(() => {
    if (!authUserId) {
      navigate('/auth');
    }
  }, [authUserId, navigate]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSaving(true);
      
      try {
        const selectedLevelData = levels.find(l => l.id === selectedLevel);
        const adaptiveLevel = selectedLevelData?.adaptiveLevel || 'B1';

        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: authUserId,
            language: selectedLanguage,
            level: selectedLevel,
            weekly_goal: selectedGoal,
            has_completed_onboarding: true,
            current_adaptive_level: adaptiveLevel,
          }, { 
            onConflict: 'user_id' 
          });

        if (error) throw error;

        updateUserProfile({
          language: selectedLanguage,
          level: selectedLevel,
          weeklyGoal: selectedGoal,
        });
        setHasCompletedOnboarding(true);
        
        toast({
          title: t('onboarding.success.title'),
          description: t('onboarding.success.description'),
        });
        
        navigate('/home');
      } catch (error) {
        console.error('Error saving onboarding:', error);
        toast({
          title: t('onboarding.error.title'),
          description: t('onboarding.error.description'),
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="p-4 flex items-center gap-4">
        {step > 1 && (
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex-1 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'gradient-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('onboarding.step1.title')}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t('onboarding.step1.subtitle')}
            </p>

            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as Language)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedLanguage === lang.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="font-semibold text-foreground">{lang.name}</span>
                  {selectedLanguage === lang.id && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('onboarding.step2.title')}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t('onboarding.step2.subtitle')}
            </p>

            <div className="space-y-3">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id as Level)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedLevel === level.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{level.name}</p>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                  {selectedLevel === level.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('onboarding.step3.title')}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t('onboarding.step3.subtitle')}
            </p>

            <div className="space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id as WeeklyGoal)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedGoal === goal.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  {selectedGoal === goal.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-8">
        <Button size="xl" className="w-full" onClick={handleNext} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('onboarding.saving')}
            </>
          ) : step === 3 ? (
            <>
              {t('onboarding.startPracticing')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              {t('common.continue')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
