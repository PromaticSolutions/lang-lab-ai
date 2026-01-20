-- Update the handle_new_user function to include audio credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar perfil padrão
  INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    language,
    level,
    weekly_goal,
    plan,
    has_completed_onboarding,
    current_adaptive_level,
    total_conversations,
    average_score
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'english',
    'basic',
    5,
    'free_trial',
    false,
    'A1',
    0,
    0
  );
  
  -- Criar settings padrão
  INSERT INTO public.user_settings (
    user_id,
    theme,
    notifications_enabled,
    voice_enabled
  ) VALUES (
    NEW.id,
    'light',
    true,
    false
  );
  
  -- Criar créditos iniciais de trial (70 mensagens, 14 áudios)
  INSERT INTO public.user_credits (
    user_id,
    total_credits,
    used_credits,
    total_audio_credits,
    used_audio_credits,
    trial_started_at,
    trial_ends_at
  ) VALUES (
    NEW.id,
    70,
    0,
    14,
    0,
    NOW(),
    NOW() + INTERVAL '7 days'
  );
  
  RETURN NEW;
END;
$function$;