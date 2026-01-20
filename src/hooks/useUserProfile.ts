import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Language, Level, WeeklyGoal, PlanType } from '@/types';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  language: Language;
  level: Level;
  weekly_goal: WeeklyGoal;
  plan: PlanType;
  has_completed_onboarding: boolean;
  current_adaptive_level: string | null;
  total_conversations: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  voice_enabled: boolean;
}

export const useUserProfile = (authUserId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!authUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
      }

      // Buscar settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setSettings(settingsData as unknown as UserSettings);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  }, [authUserId]);

  const createProfile = useCallback(async (profileData: {
    name: string;
    email: string;
    language: Language;
    level: Level;
    weeklyGoal: WeeklyGoal;
  }): Promise<boolean> => {
    if (!authUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authUserId,
          name: profileData.name,
          email: profileData.email,
          language: profileData.language,
          level: profileData.level,
          weekly_goal: profileData.weeklyGoal,
          has_completed_onboarding: false,
          current_adaptive_level: profileData.level === 'basic' ? 'A1' : profileData.level === 'intermediate' ? 'B1' : 'C1',
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data as unknown as UserProfile);

      // Criar settings padrão
      await supabase
        .from('user_settings')
        .insert({
          user_id: authUserId,
          theme: 'light',
          notifications_enabled: true,
          voice_enabled: false,
        });

      return true;
    } catch (err) {
      console.error('Error creating profile:', err);
      return false;
    }
  }, [authUserId]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!authUserId || !profile) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authUserId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      return false;
    }
  }, [authUserId, profile]);

  const completeOnboarding = useCallback(async (data: {
    language: Language;
    level: Level;
    weeklyGoal: WeeklyGoal;
  }): Promise<boolean> => {
    if (!authUserId) return false;

    const adaptiveLevel = data.level === 'basic' ? 'A1' : data.level === 'intermediate' ? 'B1' : 'C1';

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          language: data.language,
          level: data.level,
          weekly_goal: data.weeklyGoal,
          has_completed_onboarding: true,
          current_adaptive_level: adaptiveLevel,
        })
        .eq('user_id', authUserId);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        language: data.language,
        level: data.level,
        weekly_goal: data.weeklyGoal,
        has_completed_onboarding: true,
        current_adaptive_level: adaptiveLevel,
      } : null);

      return true;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      return false;
    }
  }, [authUserId]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>): Promise<boolean> => {
    if (!authUserId) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', authUserId);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  }, [authUserId]);

  // Atualizar nível adaptativo baseado no desempenho
  const updateAdaptiveLevel = useCallback(async (score: number): Promise<void> => {
    if (!authUserId || !profile) return;

    const currentLevel = profile.current_adaptive_level || 'B1';
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);

    let newLevel = currentLevel;

    // Se score > 85, considera subir de nível
    if (score >= 85 && currentIndex < levels.length - 1) {
      newLevel = levels[currentIndex + 1];
    }
    // Se score < 50, considera descer de nível
    else if (score < 50 && currentIndex > 0) {
      newLevel = levels[currentIndex - 1];
    }

    if (newLevel !== currentLevel) {
      await updateProfile({ 
        current_adaptive_level: newLevel,
        total_conversations: (profile.total_conversations || 0) + 1,
      });
    } else {
      await updateProfile({ 
        total_conversations: (profile.total_conversations || 0) + 1,
      });
    }
  }, [authUserId, profile, updateProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    settings,
    isLoading,
    error,
    createProfile,
    updateProfile,
    completeOnboarding,
    updateSettings,
    updateAdaptiveLevel,
    refetch: fetchProfile,
  };
};
