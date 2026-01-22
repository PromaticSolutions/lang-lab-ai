import { useState, useCallback, useRef } from 'react';

interface UseElevenLabsTTSOptions {
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const { language = 'english', onStart, onEnd, onError } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    // Stop any current playback
    stop();
    
    setIsLoading(true);
    onStart?.();

    try {
      const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
      
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar áudio');
      }

      // Get audio blob from stream
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      currentUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise((resolve, reject) => {
        audio.oncanplaythrough = () => {
          setIsLoading(false);
          setIsSpeaking(true);
          audio.play().catch(reject);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentUrlRef.current = null;
          onEnd?.();
          resolve();
        };

        audio.onerror = () => {
          setIsLoading(false);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentUrlRef.current = null;
          const error = 'Erro ao reproduzir áudio';
          onError?.(error);
          reject(new Error(error));
        };
      });

    } catch (error) {
      setIsLoading(false);
      setIsSpeaking(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onError?.(errorMessage);
      throw error;
    }
  }, [language, onStart, onEnd, onError, stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    isSupported: true, // ElevenLabs works everywhere
  };
}
