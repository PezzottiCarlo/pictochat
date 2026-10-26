import { useEffect, useRef, useState } from 'react';
import { PauseOutlined, SoundOutlined } from '@ant-design/icons';
import { IconButton, type IconButtonProps } from '@/components/ui';
import { isSpeechSupported, speak, stopSpeaking } from '@/services/aac';

export interface SpeakButtonProps {
  /** What is read aloud. */
  text: string;
  /** Spoken name (default "Leggi ad alta voce"). */
  label?: string;
  variant?: IconButtonProps['variant'];
  className?: string;
}

/** Reads `text` aloud; pressing it again while speaking stops the voice. */
export function SpeakButton({ text, label = 'Leggi ad alta voce', variant = 'tinted', className }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const run = useRef(0);

  // Stop when the text changes (next step) or the button unmounts.
  useEffect(
    () => () => {
      run.current += 1;
      stopSpeaking();
      setSpeaking(false);
    },
    [text],
  );

  if (!isSpeechSupported()) return null;

  const toggle = async () => {
    if (speaking) {
      run.current += 1;
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const id = ++run.current;
    setSpeaking(true);
    await speak(text);
    if (run.current === id) setSpeaking(false);
  };

  return (
    <IconButton
      className={className}
      variant={variant}
      icon={speaking ? <PauseOutlined /> : <SoundOutlined />}
      aria-label={speaking ? 'Ferma la voce' : label}
      aria-pressed={speaking}
      onClick={() => void toggle()}
    />
  );
}
