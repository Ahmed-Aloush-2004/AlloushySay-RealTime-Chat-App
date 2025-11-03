// CustomAudioPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  isCurrentUser: boolean;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, isCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTimeDisplay = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${isCurrentUser ? 'bg-primary/20' : 'bg-base-200'}`}>
      <audio ref={audioRef} src={src} className="hidden" />
      <button
        onClick={togglePlayPause}
        className={`btn btn-circle btn-ghost btn-sm ${isCurrentUser ? 'text-primary' : 'text-base-content'}`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className={`range range-xs ${isCurrentUser ? 'range-primary' : 'range-neutral'}`}
        />
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{formatTimeDisplay(currentTime)}</span>
          <span>{formatTimeDisplay(duration)}</span>
        </div>
      </div>
      <Volume2 className={`w-4 h-4 ${isCurrentUser ? 'text-primary' : 'text-base-content'}`} />
    </div>
  );
};