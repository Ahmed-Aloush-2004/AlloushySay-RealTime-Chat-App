// components/RecordingError.tsx
import React from 'react';
import { X } from 'lucide-react';

interface RecordingErrorProps {
  error: string | null;
  onDismissError: () => void;
}

export const RecordingError: React.FC<RecordingErrorProps> = ({ error, onDismissError }) => {
  if (!error) return null;

  return (
    <div className="p-2 bg-base-200 border-t border-base-300">
      <div className="flex items-center justify-between p-2 bg-error/10 rounded-lg">
        <div className="flex items-center gap-2">
          <p className="text-error text-sm">{error}</p>
        </div>
        <button
          className="btn btn-ghost btn-xs btn-circle"
          onClick={onDismissError}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};