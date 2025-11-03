// components/MessageInput.tsx
import React from 'react';
import { Send, Paperclip, Mic, StopCircle } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  isUploading: boolean;
  isReadyToSend: boolean;
  isFileInputDisabled: boolean;
  audioFileToUpload: File | null;
  selectedFile: File | null;
  isMember: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  handleSendMessage,
  handleFileSelect,
  fileInputRef,
  isRecording,
  recordingTime,
  startRecording,
  stopRecording,
  isUploading,
  isReadyToSend,
  isFileInputDisabled,
  audioFileToUpload,
  selectedFile,
  isMember,
  handleInputChange,
  handleInputBlur
}) => {
  return (
    <div className="p-4 bg-base-100 border-t border-base-300">
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 form-control relative">
          {isRecording ? (
            <div className="flex items-center justify-start h-12 px-4 bg-error/10 text-error rounded-full shadow-inner">
              <div className="w-3 h-3 bg-error rounded-full animate-pulse mr-2" />
              <span className="font-mono text-sm">{formatTime(recordingTime)} Recording...</span>
            </div>
          ) : (
            <div className="input-group">
              <input
                id="message-input"
                type="text"
                className="input input-bordered input-primary w-full focus:outline-none rounded-full pr-16"
                placeholder="Type a message..."
                value={message}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={!isMember || isUploading || !!audioFileToUpload || !!selectedFile}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={!isMember || isFileInputDisabled}
                accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  className={`btn btn-circle btn-ghost btn-sm ${!isMember || isFileInputDisabled ? 'btn-disabled' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isMember || isFileInputDisabled}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {isRecording ? (
          <button
            type="button"
            className="btn btn-error btn-circle shadow-lg"
            onClick={stopRecording}
          >
            <StopCircle className="w-6 h-6" />
          </button>
        ) : isReadyToSend ? (
          <button
            type="submit"
            className={`btn btn-primary btn-circle shadow-lg ${isUploading ? 'btn-disabled' : ''}`}
            disabled={!isMember || !isReadyToSend || isUploading}
          >
            {isUploading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-circle shadow-lg hover:bg-primary/10"
            onClick={startRecording}
            disabled={!isMember || isUploading}
          >
            <Mic className="w-6 h-6 text-primary" />
          </button>
        )}
      </form>
    </div>
  );
};