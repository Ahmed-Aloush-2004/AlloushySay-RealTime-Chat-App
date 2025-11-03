import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { useSocketStore } from '../../stores/socketStore';
import { useApiStore } from '../../stores/apiStore';
import type { FileUploadResponse } from '../../common/interfaces/fileUploadResponse';
import type { Message } from '../../common/interfaces/message';
import { GroupHeader } from './GroupHeader';
import { TransferAdminModal } from './TransferAdminModal';
import { MessageList } from './MessageList';
import { ReplyPreview } from '../ReplyPreview';
import MessageInput from '../MessageInput';
import { ImageModal } from '../ImageModal';
import FilePreview from '../FilePreview';
import toast from 'react-hot-toast';

// Using a more reliable path for the notification sound
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

const GroupChat: React.FC = () => {
  const { id: groupId } = useParams();
  const { fileAPI } = useApiStore();

  if (!groupId) {
    throw new Error("GroupId must be provided");
  }

  // Use the store directly instead of the hook
  const {
    currentGroup,
    groupMessages,
    onlineUsers,
    isJoining,
    isLeaving,
    error,
    sendMessageToGroup,
    markMessageAsRead,
    transferAdmin,
    joinGroup,
    leaveGroup,
    fetchGroupById,
    clearError,
    setUserTyping,
    removeUserTyping,
    addNewGroupMessage,
  } = useGroupStore();

  const { socket, initializeSocket } = useSocketStore();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Corrected type
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Corrected type
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

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFileToUpload, setAudioFileToUpload] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_URL);
    notificationSoundRef.current.volume = 0.5;
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
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Check for new messages and play notification
  useEffect(() => {
    const messages = groupId ? (groupMessages[groupId] || []) : [];
    const currentMessageCount = messages.length;

    if (currentMessageCount > previousMessageCount && previousMessageCount > 0) {
      const lastMessage = messages[messages.length - 1];

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
      setPreviousMessageCount(0);
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


      addNewGroupMessage(data.groupId, data.message);
    };

    socket.on('newGroupMessage', handleNewGroupMessage);

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
      toast.error(error);
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Remove audio recording
  const handleRemoveAudio = useCallback(() => {
    setAudioFileToUpload(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleRemoveAudio();
  }, [handleRemoveAudio]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleRemoveAudio();

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
      toast.error(error.response?.data?.message || error.message || 'Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [fileAPI]);

  // Start audio recording
  const startRecording = useCallback(async () => {
    if (isUploading) return;

    handleRemoveFile();

    try {
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API is not supported in your browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

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
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: recorder.mimeType });

          console.log('Audio file created:', audioFile);
          setAudioFileToUpload(audioFile);

          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        } catch (error) {
          console.error('Error processing audio recording:', error);
          toast.error('Failed to process audio recording');
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording failed');
        setIsRecording(false);

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
      toast.error(err.message || 'Failed to access microphone');
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
        messageType = 'document';
      }
    }

    await sendMessageToGroup(groupId, finalContentType, messageType, replyTo?._id, fileName, fileType);

    setMessage('');
    setReplyTo(null);
    handleRemoveFile();
    setShouldAutoScroll(true);
  }, [message, user, selectedFile, audioFileToUpload, uploadFile, handleRemoveFile, groupId, sendMessageToGroup, replyTo]);

  // Handle leave group
  const handleLeaveGroup = useCallback(async () => {
    if (user) { // Check if user exists
      await leaveGroup(groupId, user._id); // Pass the user ID
    } else {
      toast.error("User information not available");
      return;
    }
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


  // Get online users for the current group
  const onlineUsersArray = groupId ?
    Array.from(onlineUsers[groupId] || []) : [];

  // Check if ready to send
  const isReadyToSend = !!(message.trim() || selectedFile || audioFileToUpload);
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

      <GroupHeader
        currentGroup={currentGroup}
        isMember={isMember || false}
        isAdmin={isAdmin || false}
        onlineUsersCount={onlineUsersArray.length}
        isLeaving={isLeaving}
        isJoining={isJoining}
        onLeaveGroup={handleLeaveGroup}
        onJoinGroup={handleJoinGroup}
      />

      <MessageList
        messages={messages}
        isMember={isMember}
        userId={user?._id}
        onImageClick={openImageModal}
        onReplyClick={handleReplyToMessage}
        onMarkAsRead={handleMarkAsRead}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        handleScroll={handleScroll}
        groupId={groupId}
      />


      <ReplyPreview
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      <FilePreview
        selectedFile={selectedFile}
        audioFileToUpload={audioFileToUpload}
        audioUrl={audioUrl}
        filePreview={filePreview}
        recordingTime={recordingTime}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        handleRemoveFile={handleRemoveFile}
      />

      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        isRecording={isRecording}
        recordingTime={recordingTime}
        startRecording={startRecording}
        stopRecording={stopRecording}
        isUploading={isUploading}
        isReadyToSend={isReadyToSend}
        isFileInputDisabled={isFileInputDisabled}
        audioFileToUpload={audioFileToUpload}
        selectedFile={selectedFile}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
      />

      <ImageModal
        src={modalImageSrc}
        alt="Full size image"
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />

      {isAdmin && (
        <TransferAdminModal
          currentGroup={currentGroup}
          user={user}
          onTransferAdmin={handleTransferAdmin}
        />
      )}
    </div>
  );
};

export default GroupChat;