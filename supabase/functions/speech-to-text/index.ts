import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm', language = 'english' } = await req.json();
    
    if (!audio) {
      throw new Error('Nenhum áudio fornecido');
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    console.log('[STT] Processing audio with ElevenLabs Scribe v2');
    console.log('[STT] Audio base64 length:', audio.length);
    console.log('[STT] MimeType:', mimeType);
    console.log('[STT] Language:', language);

    // Decode the incoming base64 audio
    const binaryAudio = base64ToUint8Array(audio);
    console.log('[STT] Decoded audio size:', binaryAudio.length, 'bytes');

    // Create blob for FormData - cast to ArrayBuffer to fix Deno type issue
    const audioBlob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: mimeType });
    
    // Determine file extension from mimeType
    const extension = mimeType.includes('webm') ? 'webm' : 'wav';
    
    // Prepare FormData for ElevenLabs API
    const formData = new FormData();
    formData.append("file", audioBlob, `audio.${extension}`);
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", getLanguageCode(language));

    console.log('[STT] Sending to ElevenLabs with language_code:', getLanguageCode(language));

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
      console.error("[STT] ElevenLabs error:", response.status, errorText);
      throw new Error(`Erro na transcrição: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const transcribedText = result.text?.trim() || '';
    
    console.log('[STT] Transcription successful');
    console.log('[STT] Result preview:', transcribedText.substring(0, 100));

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[STT] Speech-to-text error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro na transcrição' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
