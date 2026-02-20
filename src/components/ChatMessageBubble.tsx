import React, { memo } from 'react';
import { Languages, Volume2, Lightbulb } from 'lucide-react';
import { Message } from '@/types';

interface InstantFeedback {
  tip: string;
  type: 'tip' | 'praise';
}

interface ChatMessageBubbleProps {
  message: Message;
  feedback?: InstantFeedback;
  isSpeaking: boolean;
  isTTSLoading: boolean;
  isCurrentlyPlaying: boolean;
  onTranslate: (messageId: string, content: string) => void;
  onSpeak: (messageId: string, content: string) => void;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  feedback,
  isSpeaking,
  isTTSLoading,
  isCurrentlyPlaying,
  onTranslate,
  onSpeak,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className="space-y-2 animate-fade-in">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'gradient-primary text-white rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={`text-xs ${isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && (
              <>
                <button
                  onClick={() => onTranslate(message.id, message.content)}
                  className="text-xs text-primary hover:underline min-w-[44px] min-h-[44px] flex items-center justify-center -m-3"
                >
                  <Languages className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSpeak(message.id, message.content)}
                  className={`text-xs hover:underline min-w-[44px] min-h-[44px] flex items-center justify-center -m-3 ${
                    (isSpeaking || isTTSLoading) && isCurrentlyPlaying
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Instant Feedback Card */}
      {!isUser && feedback && (
        <div className="flex justify-start pl-2">
          <div
            className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3 py-2 text-sm border ${
              feedback.type === 'praise'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">{feedback.tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
