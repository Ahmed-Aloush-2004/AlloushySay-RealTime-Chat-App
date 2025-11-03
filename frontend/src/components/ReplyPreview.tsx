// components/ReplyPreview.tsx
import React from 'react';
import { X } from 'lucide-react';
import type { Message } from '../common/interfaces/message';

interface ReplyPreviewProps {
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, onCancelReply }) => {
  if (!replyTo) return null;

  return (
    <div className="p-2 bg-base-200 border-t border-base-300">
      <div className="flex items-center justify-between p-2 bg-base-100 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold">Replying to:</div>
          <div className="text-xs truncate max-w-xs">
            {replyTo.content.substring(0, 50)}...
          </div>
        </div>
        <button
          className="btn btn-ghost btn-xs btn-circle"
          onClick={onCancelReply}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};