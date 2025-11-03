import { Image, File as FileIcon, FileAudio, FileVideo } from 'lucide-react';


export const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  else return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
};

// export const getFileIcon = (type: string)  => {
//   if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
//   if (type.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
//   if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5" />;
//   return <FileIcon className="w-5 h-5" />;
// };


// Return the component itself, not a JSX element
export const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  return FileIcon;
};