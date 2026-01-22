import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map language to appropriate ElevenLabs voice
function getVoiceForLanguage(language: string): string {
  const voiceMap: Record<string, string> = {
    'english': 'JBFqnCBsd6RMkjVDRZzb', // George - British, warm
    'spanish': 'onwK4e9ZLuTAKqWW03F9', // Daniel
    'french': 'EXAVITQu4vr4xnSDxMaL', // Sarah
    'german': 'N2lVS1w4EtoT3dr4eOWO', // Callum
    'italian': 'XB0fDUnXU5powFXDhCwa', // Charlotte
  };
  return voiceMap[language?.toLowerCase()] || 'JBFqnCBsd6RMkjVDRZzb';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = 'english' } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    console.log('[TTS] Generating speech with ElevenLabs');
    console.log('[TTS] Text length:', text.length);
    console.log('[TTS] Language:', language);

    const voiceId = getVoiceForLanguage(language);
    console.log('[TTS] Voice ID:', voiceId);

    // Call ElevenLabs TTS API directly
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] ElevenLabs error:', response.status, errorText);
      throw new Error(`TTS error: ${response.status}`);
    }

    console.log('[TTS] Streaming response');

    // Stream the response directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error("[TTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar áudio' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
