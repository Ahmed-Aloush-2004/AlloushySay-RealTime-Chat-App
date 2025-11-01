import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, X, Mic, StopCircle, Download, Play, Pause, Volume2, Image, FileVideo, FileAudio, File as FileIcon, Crown } from 'lucide-react';
import GroupTypingIndicator from './GroupTypingIndicator';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { useParams } from 'react-router-dom';
import type { FileUploadResponse } from '../../common/interfaces/fileUploadResponse';
import type { Message } from '../../common/interfaces/message';
import { useSocketStore } from '../../stores/socketStore';
import { useApiStore } from '../../stores/apiStore';

// Using a more reliable path for the notification sound
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// Helper functions
const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  else return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
  if (type.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
  if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5" />;
  return <FileIcon className="w-5 h-5" />;
};

// Custom Audio Player Component
const CustomAudioPlayer: React.FC<{ src: string; isCurrentUser: boolean }> = ({ src, isCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setError(null);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    const handleAudioError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        setError('Failed to play audio');
      });
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

  const formatTimeDisplay = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${isCurrentUser ? 'bg-primary/20' : 'bg-base-200'}`}>
        <div className="text-error text-sm">{error}</div>
      </div>
    );
  }

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

// Image Modal Component
const ImageModal: React.FC<{ src: string; alt: string; isOpen: boolean; onClose: () => void }> = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full max-h-[90vh]">
        <button
          className="absolute top-2 right-2 btn btn-circle btn-ghost text-white bg-black/30 hover:bg-black/50 z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Message Component
const MessageComponent: React.FC<{
  msg: Message;
  isCurrentUser: boolean;
  onImageClick: (src: string) => void;
  onReplyClick: (msg: Message) => void;
  onMarkAsRead: (messageId: string) => void;
}> = ({
  msg,
  isCurrentUser,
  onImageClick,
  onReplyClick,
  onMarkAsRead
}) => {
    const renderMessageContent = () => {
      switch (msg.messageType) {
        case 'image':
          return (
            <div className="relative group cursor-pointer" onClick={() => onImageClick(msg.content)}>
              <img
                src={msg.content}
                alt="Chat Image"
                className="rounded-lg max-w-full h-auto max-h-64 object-cover transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2">
                  <Image className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </div>
          );

        case 'video':
          return (
            <div className="rounded-lg overflow-hidden max-w-full max-h-64 bg-black">
              <video
                src={msg.content}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );

        case 'audio':
          return <CustomAudioPlayer src={msg.content} isCurrentUser={isCurrentUser} />;

        case 'document':
        case 'raw':
          return (
            <div className="flex items-center gap-2 p-2">
              <div className="bg-base-300 rounded-lg p-2">
                {getFileIcon(msg.fileType || 'application/octet-stream')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{msg.fileName || 'File Attachment'}</p>
                <p className="text-xs opacity-70">Click to download</p>
              </div>
              <a
                href={msg.content}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm btn-circle"
                download
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          );

        default:
          return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
      }
    };

    return (
      <div className={`chat ${isCurrentUser ? 'chat-end' : 'chat-start'}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full bg-base-300 flex items-center justify-center text-lg font-bold">
            {msg.sender?.toString()?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="chat-header text-xs text-base-content/50 mb-1">
          {isCurrentUser ? 'You' : (msg.sender as any)?.username || 'Unknown User'}
          <time className="ml-1">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          {!isCurrentUser && !msg.isRead && (
            <button
              className="ml-2 text-xs btn btn-ghost btn-xs h-4 min-h-4 px-1"
              onClick={() => onMarkAsRead(msg._id)}
            >
              Mark as read
            </button>
          )}
        </div>
        <div className={`chat-bubble ${isCurrentUser ? 'chat-bubble-primary' : 'bg-base-100 text-base-content'} relative max-w-xs md:max-w-md lg:max-w-lg shadow-md`}>
          {msg.replyTo && (
            <div className="text-xs opacity-70 mb-1 p-1 bg-black/10 rounded">
              <span className="font-semibold">Replying to:</span> {(msg.replyTo as any)?.content?.substring(0, 30) || 'Message'}...
            </div>
          )}
          {renderMessageContent()}
          <button
            className="absolute top-0 right-0 -mt-2 -mr-2 btn btn-ghost btn-xs btn-circle opacity-0 hover:opacity-100 transition-opacity"
            onClick={() => onReplyClick(msg)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

const GroupChat: React.FC = () => {
  const { id: groupId } = useParams();
  const { fileAPI }  = useApiStore()
  if (!groupId) {
    throw new Error("GroupId must be provided");
  }

  // Use the store directly instead of the hook
  const {
    currentGroup,
    groupMessages,
    typingUsers,
    onlineUsers,
    isLoading,
    isJoining,
    isLeaving,
    error,
    sendMessageToGroup,
    startTypingInGroup,
    stopTypingInGroup,
    markMessageAsRead,
    transferAdmin,
    joinGroup,
    leaveGroup,
    fetchGroupById,
    setCurrentGroup,
    clearError,
    setUserTyping,
    removeUserTyping,
    addNewGroupMessage,
  } = useGroupStore();
  const { socket,initializeSocket } = useSocketStore()

  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track if we should scroll to bottom on new messages
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  // Notification sound ref
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Add state for upload errors
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFileToUpload, setAudioFileToUpload] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  // Initialize notification sound
  useEffect(() => {
    // Preload the notification sound
    notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_URL);
    notificationSoundRef.current.volume = 0.5;

    // Try to load the sound to ensure it's ready
    notificationSoundRef.current.load();

    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(err => {
        console.error('Failed to play notification sound:', err);
      });
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldAutoScroll]);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // If we're within 100px of the bottom, enable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Check for new messages and play notification
  useEffect(() => {
    const messages = groupId ? (groupMessages[groupId] || []) : [];
    const currentMessageCount = messages.length;

    // If we have new messages and we're not the sender
    if (currentMessageCount > previousMessageCount && previousMessageCount > 0) {
      const lastMessage = messages[messages.length - 1];

      // Only play notification if the message is not from the current user
      if (lastMessage && lastMessage.sender !== user?._id) {
        playNotificationSound();
      }
    }

    setPreviousMessageCount(currentMessageCount);
  }, [groupMessages, groupId, previousMessageCount, user?._id, playNotificationSound]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [groupMessages, scrollToBottom]);

  // Fetch group data when groupId changes
  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      setPreviousMessageCount(0); // Reset message count when changing groups
    }
  }, [groupId, fetchGroupById]);

  // Initialize socket
  useEffect(() => {
    if (user && !socket) {
      initializeSocket(user._id);
    }
  }, [user, initializeSocket]);

  // Listen for incoming messages from the server
  useEffect(() => {
    if (!socket) return;

    const handleNewGroupMessage = (data: { groupId: string; message: Message }) => {
      console.log('New message received:', data);
      // Add the message to the store
      addNewGroupMessage(data.groupId, data.message);
    };

    socket.on('newGroupMessage', handleNewGroupMessage);

    // Cleanup the listener when the component unmounts or socket changes
    return () => {
      socket.off('newGroupMessage', handleNewGroupMessage);
    };
  }, [socket, addNewGroupMessage]);

  // Handle groupTypingUpdate events
  useEffect(() => {
    if (!socket) return;

    const handleGroupTypingUpdate = (data: { groupId: string; senderId: string; isTyping: boolean }) => {
      const { groupId, senderId, isTyping } = data;
      
      if (senderId === user?._id) return;
      
      if (isTyping) {
        setUserTyping(groupId, senderId);
      } else {
        removeUserTyping(groupId, senderId);
      }
    };

    socket.on('groupTypingUpdate', handleGroupTypingUpdate);

    return () => {
      socket.off('groupTypingUpdate', handleGroupTypingUpdate);
    };
  }, [socket, user?._id, setUserTyping, removeUserTyping]);

  // Handle errors
  useEffect(() => {
    if (error) {
      // You could add a toast notification here
      // console.error(error);
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Stop all media stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Revoke audio URL if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Remove audio recording
  const handleRemoveAudio = useCallback(() => {
    setAudioFileToUpload(null);
    setRecordingError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    // Clear the upload error when removing the file
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleRemoveAudio();
  }, [handleRemoveAudio]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleRemoveAudio();
    setUploadError(null); // Clear error on new selection

    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  }, [handleRemoveAudio]);

  // Upload file to server
  const uploadFile = useCallback(async (fileToUpload: File): Promise<FileUploadResponse | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null); // Clear previous errors

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fileAPI.uploadFile(fileToUpload);

      clearInterval(progressInterval);
      setUploadProgress(100);

      return response.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Set a user-friendly error message
      setUploadError(error.response?.data?.message || error.message || 'Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Start audio recording
  const startRecording = useCallback(async () => {
    if (isUploading) return;

    handleRemoveFile();
    setRecordingError(null);

    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API is not supported in your browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          // Create a File object from the Blob for upload
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: recorder.mimeType });

          
          
          // Log the created file for debugging
          console.log('Audio file created:', audioFile);

          setAudioFileToUpload(audioFile);

          // Create a temporary URL for the preview player
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Stop all stream tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        } catch (error) {
          console.error('Error processing audio recording:', error);
          setRecordingError('Failed to process audio recording');
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setRecordingError('Recording failed');
        setIsRecording(false);
        
        // Stop all stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      setRecordingError(err.message || 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isUploading, handleRemoveFile]);

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Send message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const fileToUpload = selectedFile || audioFileToUpload;
    const content = message.trim();

    if ((!content && !fileToUpload) || !user) {
      return;
    }

    let fileResponse: FileUploadResponse | null = null;
    let finalContentType: string | null = content;
    let messageType: string = 'text';
    let fileName: string | undefined;
    let fileType: string | undefined;

    if (fileToUpload) {
      fileResponse = await uploadFile(fileToUpload);

      if (!fileResponse || !fileResponse.url) {
        // The error is now handled and displayed by the uploadFile function itself.
        // We can just return here.
        return;
      }

      finalContentType = fileResponse.url;
      fileName = fileToUpload.name;
      fileType = fileToUpload.type;

      if (fileToUpload.type.startsWith('image/')) {
        messageType = 'image';
      } else if (fileToUpload.type.startsWith('video/')) {
        messageType = 'video';
      } else if (fileToUpload.type.startsWith('audio/')) {
        messageType = 'audio';
      } else {
        messageType = 'document'; // Changed from 'raw' to 'document' to match schema
      }
    }

    if (!finalContentType) return;

    // Send message via API
    await sendMessageToGroup(groupId, finalContentType, messageType, replyTo?._id, fileName, fileType);

    setMessage('');
    setReplyTo(null);
    handleRemoveFile();

    // Ensure we scroll to bottom after sending a message
    setShouldAutoScroll(true);
  }, [message, user, selectedFile, audioFileToUpload, uploadFile, handleRemoveFile, groupId, sendMessageToGroup, replyTo]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    startTypingInGroup(groupId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingInGroup(groupId);
    }, 1000);
  }, [groupId, startTypingInGroup, stopTypingInGroup]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    stopTypingInGroup(groupId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [groupId, stopTypingInGroup]);

  // Handle leave group
  const handleLeaveGroup = useCallback(async () => {
    await leaveGroup(groupId);
  }, [groupId, user, leaveGroup]);

  // Handle join group
  const handleJoinGroup = useCallback(async () => {
    if (user?._id) {
      await joinGroup(groupId, user._id);
    }
  }, [groupId, user, joinGroup]);

  // Handle transfer admin
  const handleTransferAdmin = useCallback(async (newAdminId: string) => {
    await transferAdmin(groupId, newAdminId);
  }, [groupId, transferAdmin]);

  // Handle mark message as read
  const handleMarkAsRead = useCallback((messageId: string) => {
    markMessageAsRead(groupId, messageId);
  }, [groupId, markMessageAsRead]);

  // Handle reply to message
  const handleReplyToMessage = useCallback((msg: Message) => {
    setReplyTo(msg);
    // Focus the input
    document.getElementById('message-input')?.focus();
  }, []);

  // Open image modal
  const openImageModal = useCallback((src: string) => {
    setModalImageSrc(src);
    setImageModalOpen(true);
  }, []);

  // Check if user is member
  const isMember = user && currentGroup?.members?.some(member => member._id === user._id);

  // Check if user is admin
  const isAdmin = user && currentGroup?.admin?._id === user._id;

  // Get messages for the current group
  const messages = groupId ? (groupMessages[groupId] || []) : [];

  // Get typing users for the current group
  const typingUsersArray = groupId ?
    Array.from(typingUsers[groupId] || []).filter(id => id !== user?._id) : [];

  // Get online users for the current group
  const onlineUsersArray = groupId ?
    Array.from(onlineUsers[groupId] || []) : [];

  // Check if ready to send
  const isReadyToSend = message.trim() || selectedFile || audioFileToUpload;
  const isFileInputDisabled = isUploading || isRecording || !!audioFileToUpload;

  if (!currentGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold">Group not found</h3>
          <p className="text-gray-500">The group you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="bg-base-100 border-b border-base-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="avatar placeholder mr-3">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
                {currentGroup.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {currentGroup.name}
                {isAdmin && <Crown className="w-4 h-4 text-yellow-500" />}
              </h2>
              <p className="text-sm text-base-content/70">
                {currentGroup.members?.length || 0} members, {onlineUsersArray.length} online
              </p>
            </div>
          </div>

          {isMember ? (
            <div className="flex gap-2">
              {isAdmin && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-sm">
                    Admin
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <label htmlFor="transfer-admin-modal" className="justify-between">
                        Transfer Admin
                      </label>
                    </li>
                  </ul>
                </div>
              )}
              <button
                onClick={handleLeaveGroup}
                className="btn text-white bg-red-500 hover:bg-red-600"
                disabled={isLeaving}
              >
                {isLeaving ? "Leaving..." : "Leave"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinGroup}
              className="btn text-white bg-green-500 hover:bg-green-600"
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-base-200 to-base-300"
        onScroll={handleScroll}
      >
        {(isMember || isAdmin) && messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageComponent
              key={`${msg._id}-${index}`} // Using a combination of message ID and index to ensure uniqueness
              msg={msg}
              isCurrentUser={msg.sender === user?._id}
              onImageClick={openImageModal}
              onReplyClick={handleReplyToMessage}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        ) : isMember ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold">No messages yet</h3>
            <p className="text-gray-500">Be the first one to send a message!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold">Join this group</h3>
            <p className="text-gray-500">Join this group to be able to see and receive messages!</p>
          </div>
        )}

        <GroupTypingIndicator groupId={groupId} />
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
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
              onClick={() => setReplyTo(null)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* File & Audio Preview */}
      {(selectedFile || audioFileToUpload) && (
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
                    {getFileIcon(selectedFile.type)}
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
                />
              </div>
            )}

            {/* Display Upload Error */}
            {uploadError && (
              <div className="flex-1 text-center">
                <p className="text-error text-sm">{uploadError}</p>
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
      )}

      {/* Recording Error Display */}
      {recordingError && (
        <div className="p-2 bg-base-200 border-t border-base-300">
          <div className="flex items-center justify-between p-2 bg-error/10 rounded-lg">
            <div className="flex items-center gap-2">
              <p className="text-error text-sm">{recordingError}</p>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setRecordingError(null)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input - Fixed styling and responsiveness */}
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

      {/* Image Modal */}
      <ImageModal
        src={modalImageSrc}
        alt="Full size image"
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />

      {/* Transfer Admin Modal */}
      {isAdmin && (
        <div>
          <input type="checkbox" id="transfer-admin-modal" className="modal-toggle" />
          <div className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Transfer Admin Rights</h3>
              <p className="py-4">Select a member to transfer admin rights to:</p>
              <div className="max-h-60 overflow-y-auto">
                {currentGroup.members
                  .filter(member => member._id !== user._id)
                  .map(member => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer"
                      onClick={() => {
                        handleTransferAdmin(member._id);
                        document.getElementById('transfer-admin-modal')?.click();
                      }}
                    >
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                          <span className="text-xs">{(member as any).username?.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <span>{(member as any).username}</span>
                    </div>
                  ))}
              </div>
              <div className="modal-action">
                <label htmlFor="transfer-admin-modal" className="btn">
                  Cancel
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;