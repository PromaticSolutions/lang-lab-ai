import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STT] ${step}${detailsStr}`);
};

// Decode base64 to Uint8Array
function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

// Map language names to ISO 639-3 codes for ElevenLabs
function getLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    'english': 'eng',
    'spanish': 'spa',
    'french': 'fra',
    'german': 'deu',
    'italian': 'ita',
    'portuguese': 'por',
    'japanese': 'jpn',
    'korean': 'kor',
    'chinese': 'cmn',
  };
  return languageMap[language?.toLowerCase()] || 'eng';
}

// Authentication helper using getClaims
async function authenticateUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Missing token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    logStep('Auth failed', { error: error?.message });
    return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = data.claims.sub as string;
  logStep('User authenticated', { userId });
  return { userId };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authResult = await authenticateUser(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { userId } = authResult;

    const { audio, mimeType = 'audio/webm', language = 'english' } = await req.json();
    
    if (!audio) {
      throw new Error('Nenhum áudio fornecido');
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    logStep('Processing audio with ElevenLabs Scribe v2', { userId, audioLength: audio.length, mimeType, language });

    // Decode the incoming base64 audio
    const binaryAudio = base64ToUint8Array(audio);
    logStep('Decoded audio', { sizeBytes: binaryAudio.length });

    // Create blob for FormData - cast to ArrayBuffer to fix Deno type issue
    const audioBlob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: mimeType });
    
    // Determine file extension from mimeType
    const extension = mimeType.includes('webm') ? 'webm' : 'wav';
    
    // Prepare FormData for ElevenLabs API
    const formData = new FormData();
    formData.append("file", audioBlob, `audio.${extension}`);
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", getLanguageCode(language));

    logStep('Sending to ElevenLabs', { languageCode: getLanguageCode(language) });

    // Call ElevenLabs Speech-to-Text API
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("ElevenLabs error", { status: response.status, error: errorText });
      throw new Error(`Erro na transcrição: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const transcribedText = result.text?.trim() || '';
    
    logStep('Transcription successful', { resultPreview: transcribedText.substring(0, 100) });

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro na transcrição';
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
