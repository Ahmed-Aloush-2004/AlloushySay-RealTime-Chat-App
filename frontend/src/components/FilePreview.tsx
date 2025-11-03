// FilePreview.tsx
import React from 'react';
import { X, Mic, Paperclip } from 'lucide-react';
import { formatFileSize, formatTime } from '../utils/formatters';

interface FilePreviewProps {
  selectedFile: File | null;
  audioFileToUpload: File | null;
  audioUrl: string | null;
  filePreview: string | null;
  recordingTime: number;
  isUploading: boolean;
  uploadProgress: number;
  handleRemoveFile: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  selectedFile,
  audioFileToUpload,
  audioUrl,
  filePreview,
  recordingTime,
  isUploading,
  uploadProgress,
  handleRemoveFile
}) => {
  if (!selectedFile && !audioFileToUpload) return null;

  return (
    <div className="p-2 bg-base-200 border-t border-base-300">
      <div className="flex items-center gap-4 p-3 bg-base-100 rounded-xl shadow-md">
        {(audioFileToUpload && audioUrl) ? (
          <div className="flex items-center flex-1 min-w-0">
            <div className="bg-primary/10 p-2 rounded-lg mr-2">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Audio Recording</p>
              <p className="text-xs text-base-content/50">
                {formatTime(recordingTime)}
              </p>
            </div>
            <audio controls src={audioUrl} className="hidden" />
          </div>
        ) : selectedFile && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {filePreview ? (
              <div className="relative">
                <img src={filePreview} alt="File preview" className="w-12 h-12 object-cover rounded-lg" />
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Paperclip className="w-3 h-3 text-primary-content" />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center">
                <Paperclip className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-base-content/50">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="w-24 bg-base-300 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm"
          onClick={handleRemoveFile}
          disabled={isUploading}
        >
          <X className="w-4 h-4 text-error" />
        </button>
      </div>
    </div>
  );
};

export default FilePreview;