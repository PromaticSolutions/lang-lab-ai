-- 1. Remover a política permissiva que expõe todos os dados
DROP POLICY IF EXISTS "Anyone can view public ranking data" ON public.user_profiles;

-- 2. Criar uma view segura para o ranking que expõe apenas dados não-sensíveis
-- Exclui: email, avatar_url, plan, level, language, has_completed_onboarding, weekly_goal
CREATE OR REPLACE VIEW public.user_rankings
WITH (security_invoker = on) AS
SELECT 
  user_id,
  name,
  total_conversations,
  current_streak,
  longest_streak,
  current_adaptive_level,
  average_score
FROM public.user_profiles;

-- 3. Conceder acesso de SELECT à view para usuários autenticados
GRANT SELECT ON public.user_rankings TO authenticated;

-- 4. Garantir que a política de SELECT na tabela base só permite o próprio usuário
-- (a política "Users can view their own profile" já existe e é restritiva)