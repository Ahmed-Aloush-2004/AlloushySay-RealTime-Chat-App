import { useLocation } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useMessageStore } from "../../stores/messageStore";
import type { User } from "../../common/interfaces/user";
import type { Message } from "../../common/interfaces/message";
import type { FileUploadResponse } from "../../common/interfaces/fileUploadResponse";
import { showNotification } from "../../services/notification";
import { useAuthStore } from "../../stores/authStore";
import { useSocketStore } from "../../stores/socketStore";
import { useApiStore } from "../../stores/apiStore";
import ChatHeader from "./ChatHeader";
import MessageList from "../MessageList";
import FilePreview from "../FilePreview";
import MessageInput from "../MessageInput";
import { ImageModal } from "../ImageModal";
import toast from "react-hot-toast";


// Using a more reliable path for the notification sound
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { messages, isLoading, getChatMessagesForUsers } = useMessageStore();
  const { initializeSocket, socket } = useSocketStore();
  const { fileAPI } = useApiStore();

  const selectedUser = location.state?.user as User || useAuthStore().onlineUsers[0];
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing Indicator State and Refs
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingEmitterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Audio Recording States and Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFileToUpload, setAudioFileToUpload] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Image Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  // Core Socket Handlers
  const handleTypingUpdate = useCallback((data: { senderId: string }) => {
    if (data.senderId === selectedUser?._id) {
      setIsReceiverTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsReceiverTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    }
  }, [selectedUser]);

  const handleReceiveMessage = useCallback((message: Message) => {
    const senderId = (message.sender as User)?._id
    const reciverId = (message.reciver as User)?._id;

    const isIncoming = (senderId === selectedUser?._id && reciverId === user?._id);

    if (user && selectedUser && (
      (senderId === selectedUser._id && reciverId === user._id) ||
      (senderId === user._id && reciverId === selectedUser._id)
    )) {
      useMessageStore.getState().addMessage(message);

      if (typeof message.sender === 'object' && message.sender) {
        showNotification(message.sender.username, message.content, new Date().toDateString())
      }

      if (isIncoming && notificationSoundRef.current) {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(e => {
          console.error("Failed to play notification sound. User interaction required:", e);
        });
      }
    } else {
      console.warn("Received message not relevant to current chat, ignoring.");
    }

    if (senderId === selectedUser?._id) {
      setIsReceiverTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [user, selectedUser]);

  // const sendTypingStart = useCallback(() => {
  //   if (socketRef.current && user && selectedUser) {
  //     socketRef.current.emit('typingStart', {
  //       reciverId: selectedUser._id,
  //       senderId: user._id,
  //     });
  //   }
  // }, [user, selectedUser]);



  useEffect(() => {
    notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_URL);
    notificationSoundRef.current.volume = 0.5;
    notificationSoundRef.current.load();
  }, []);

  useEffect(() => {
    if (user && selectedUser) {
      getChatMessagesForUsers(user._id?.toString(), selectedUser._id?.toString());
    }
  }, [user, selectedUser, getChatMessagesForUsers]);

  useEffect(() => {
    if (user?._id && selectedUser?._id) {
      if (!socket) {
        initializeSocket(user._id);
      }
      socketRef.current = socket;

      socket?.on('receiveMessage', handleReceiveMessage);
      socket?.on('typingUpdate', handleTypingUpdate);

      return () => {
        socket?.off('receiveMessage', handleReceiveMessage);
        socket?.off('typingUpdate', handleTypingUpdate);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (typingEmitterRef.current) {
          clearTimeout(typingEmitterRef.current);
        }
        socketRef.current = null;
      };
    }
  }, [user, selectedUser, socket, handleReceiveMessage, handleTypingUpdate, initializeSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReceiverTyping]);

  // File & Audio Handlers
  const handleRemoveAudio = useCallback(() => {
    setAudioFileToUpload(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleRemoveAudio();
  }, [handleRemoveAudio]);

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
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [fileAPI]);

  // Audio Recording Logic
  const startRecording = useCallback(async () => {
    if (isUploading) return;

    handleRemoveFile();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: recorder.mimeType });

        setAudioFileToUpload(audioFile);

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start audio recording:', err);
      toast.error('Failed to start audio recording. Please check your microphone permissions.');
      setIsRecording(false);
    }
  }, [isUploading, handleRemoveFile]);

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

  // Message Sending Logic
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const fileToUpload = selectedFile || audioFileToUpload;
    const content = message.trim();

    if ((!content && !fileToUpload) || !socketRef.current || !user || !selectedUser) {
      return;
    }

    let fileResponse: FileUploadResponse | null = null;
    let finalContentType: string | null = content;
    let messageType: Message['messageType'] = 'text';
    let fileName: string | undefined;

    if (fileToUpload) {
      fileResponse = await uploadFile(fileToUpload);

      if (!fileResponse || !fileResponse.url) {
        console.error('Failed to upload file');
        toast.error('Failed to upload file. Please try again.');
        return;
      }

      finalContentType = fileResponse.url;
      fileName = fileToUpload.name;

      if (fileToUpload.type.startsWith('image/')) {
        messageType = 'image';
      } else if (fileToUpload.type.startsWith('video/')) {
        messageType = 'video';
      } else if (fileToUpload.type.startsWith('audio/')) {
        messageType = 'audio';
      } else {
        messageType = 'raw';
      }
    }

    if (!finalContentType) return;

    const optimisticMessage: Message = {
      _id: new Date().toISOString(),
      sender: user,
      reciver: selectedUser,
      content: finalContentType,
      createdAt: new Date(),
      updatedAt: new Date(),
      isNotified: true,
      isRead: true,
      messageType: messageType,
      replyTo:null
    };

    useMessageStore.getState().addMessage(optimisticMessage);

    socketRef.current.emit('sendMessage', {
      reciverId: selectedUser._id,
      content: finalContentType,
      messageType: messageType,
      fileName: fileName,
    });

    setMessage('');
    handleRemoveFile();
  }, [message, user, selectedUser, selectedFile, audioFileToUpload, uploadFile, handleRemoveFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);

    if (text.length > 0 && socketRef.current && user && selectedUser) {
        if (!typingEmitterRef.current) {
            socketRef.current.emit('typingStart', { reciverId: selectedUser._id, senderId: user._id });
            typingEmitterRef.current = setTimeout(() => {
                typingEmitterRef.current = null;
            }, 1000);
        }
    }
  };

  const handleInputBlur = () => {};

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const text = e.target.value;
  //   setMessage(text);

  //   if (text.length > 0 && socketRef.current && user && selectedUser) {
  //       if (!typingEmitterRef.current) {
  //           socketRef.current.emit('typingStart', { reciverId: selectedUser._id, senderId: user._id });
  //           typingEmitterRef.current = setTimeout(() => {
  //               typingEmitterRef.current = null;
  //           }, 1000);
  //       }
  //   }
  // };

  const openImageModal = (src: string) => {
    setModalImageSrc(src);
    setImageModalOpen(true);
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-base-200">
        <div className="text-center p-8 bg-base-100 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4 text-primary">💬</div>
          <h3 className="text-2xl font-bold mb-2">No User Selected</h3>
          <p className="text-base-content/70">Please select a user to start chatting.</p>
          <div className="mt-6">
            <button className="btn btn-primary">Browse Users</button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = user?._id;
  const isReadyToSend = !!(message.trim() || selectedFile || audioFileToUpload);
  const isFileInputDisabled = isUploading || isRecording || !!audioFileToUpload;

  return (
    <div className="flex flex-col h-full bg-base-100">
      <ChatHeader selectedUser={selectedUser} />
      
     
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isReceiverTyping={isReceiverTyping}
        selectedUser={selectedUser}
        currentUserId={currentUserId}
        openImageModal={openImageModal}
        userId={currentUserId}
        isMember={true}
        messagesEndRef={messagesEndRef}
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
    </div>
  );
};

export default ChatPage;
