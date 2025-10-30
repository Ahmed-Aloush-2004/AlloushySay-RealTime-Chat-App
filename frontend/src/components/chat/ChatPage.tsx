import { useLocation } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Check, Send, Paperclip, Smile, MoreVertical, X, Upload, Mic, StopCircle, Download, Play, Pause, Volume2 } from "lucide-react";
import { useAuthStore } from "../../stores";
import { useMessageStore } from "../../stores/messageStore";
import type { User } from "../../common/interfaces/user";
import type { Message } from "../../common/interfaces/message";
import { initializeSocket } from "../../services/socket";
import TypingIndicator from "../TypeIndicator";
import { fileAPI } from "../../services/api";
import type { FileUploadResponse } from "../../common/interfaces/fileUploadResponse";
import { showNotification } from "../../services/notification";

// Using a more reliable path for the notification sound
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// --- Helper Functions ---
const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
};

// --- Custom Audio Player Component ---
const CustomAudioPlayer: React.FC<{ src: string; isCurrentUser: boolean }> = ({ src, isCurrentUser }) => {
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

// --- Image Modal Component ---
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

// --- Chat Page Component ---
const ChatPage: React.FC = () => {
    const location = useLocation();
    const { user } = useAuthStore();
    const { messages, isLoading, getChatMessagesForUsers } = useMessageStore();
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

    // --- Audio Recording States and Refs ---
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioFileToUpload, setAudioFileToUpload] = useState<File | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null); // For audio preview

    // Image Modal State
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState('');

    // --- Core Socket Handlers (Unchanged) ---
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
        const isConfirmation = (senderId === user?._id && reciverId === selectedUser?._id);

        if (user && selectedUser && (
            (senderId === selectedUser._id && reciverId === user._id) ||
            (senderId === user._id && reciverId === selectedUser._id)
        )) {
            useMessageStore.getState().addMessage(message);

            showNotification(message.sender.username,message.content,new Date().toDateString())

            if (isIncoming && notificationSoundRef.current) {
                // Use the preloaded sound instead of creating a new one
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

    const sendTypingStart = useCallback(() => {
        if (socketRef.current && user && selectedUser) {
            socketRef.current.emit('typingStart', {
                reciverId: selectedUser._id,
                senderId: user._id,
            });
        }
    }, [user, selectedUser]);

    // --- Effects (Unchanged) ---
    useEffect(() => {
        // Preload the notification sound
        notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_URL);
        notificationSoundRef.current.volume = 0.5;

        // Try to load the sound to ensure it's ready
        notificationSoundRef.current.load();
    }, []);

    useEffect(() => {
        if (user && selectedUser) {
            getChatMessagesForUsers(user._id?.toString(), selectedUser._id?.toString());
        }
    }, [user, selectedUser, getChatMessagesForUsers]);

    useEffect(() => {
        if (user?._id && selectedUser?._id) {
            const newSocket = initializeSocket(user._id);
            socketRef.current = newSocket;

            newSocket!.on('receiveMessage', handleReceiveMessage);
            newSocket!.on('typingUpdate', handleTypingUpdate);

            return () => {
                newSocket!.off('receiveMessage', handleReceiveMessage);
                newSocket!.off('typingUpdate', handleTypingUpdate);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                if (typingEmitterRef.current) {
                    clearTimeout(typingEmitterRef.current);
                }
                socketRef.current = null;
            };
        }

    }, [user, selectedUser, handleReceiveMessage, handleTypingUpdate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isReceiverTyping]);

    // --- File & Audio Handlers ---
    const handleRemoveAudio = useCallback(() => {
        setAudioFileToUpload(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl); // Clean up the temporary URL
            setAudioUrl(null);
        }
    }, [audioUrl]);

    const handleRemoveFile = useCallback(() => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        handleRemoveAudio(); // Also clears audio if set
    }, [handleRemoveAudio]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Ensure no recording is active when selecting a file
        handleRemoveAudio();

        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            // Create file preview
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
            // Simulate upload progress
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

            // Assume the response contains the file URL
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    // --- Audio Recording Logic ---
    const startRecording = useCallback(async () => {
        if (isUploading) return;

        // Clear any existing file/audio
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

                // Create a File object from the Blob for upload
                const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: recorder.mimeType });

                setAudioFileToUpload(audioFile);

                // Create a temporary URL for the preview player
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Stop the stream tracks after recording is finished
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start audio recording:', err);
            // Handle error, maybe show a message to the user
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

    // --- Message Sending Logic ---
    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Determine if sending text, an existing file, or an audio recording
        const fileToUpload = selectedFile || audioFileToUpload;
        const content = message.trim();

        if ((!content && !fileToUpload) || !socketRef.current || !user || !selectedUser) {
            return;
        }

        let fileResponse: FileUploadResponse | null = null;
        let finalContentType: string | null = content;
        let messageType: Message['messageType'] = 'text';
        let fileName: string | undefined;

        // Handle file/audio upload
        if (fileToUpload) {
            fileResponse = await uploadFile(fileToUpload);

            if (!fileResponse || !fileResponse.url) {
                console.error('Failed to upload file');
                return;
            }

            finalContentType = fileResponse.url;
            fileName = fileToUpload.name;

            // Determine file type
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
        };

        useMessageStore.getState().addMessage(optimisticMessage);

        socketRef.current.emit('sendMessage', {
            reciverId: selectedUser._id,
            content: finalContentType,
            messageType: messageType,
            fileName: fileName,
        });

        // Clear all inputs/files/audio states
        setMessage('');
        handleRemoveFile(); // Clears both selectedFile and audioFileToUpload/audioUrl
    }, [message, user, selectedUser, selectedFile, audioFileToUpload, uploadFile, handleRemoveFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setMessage(text);

        if (text.length > 0) {
            if (!typingEmitterRef.current) {
                sendTypingStart();
                typingEmitterRef.current = setTimeout(() => {
                    typingEmitterRef.current = null;
                }, 1000);
            }
        }
    };

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
    const isReadyToSend = message.trim() || selectedFile || audioFileToUpload;
    const isAnyAttachmentActive = selectedFile || audioFileToUpload;
    const isFileInputDisabled = isUploading || isRecording || !!audioFileToUpload;

    return (
        <div className="flex flex-col h-full bg-base-100">
            {/* Chat Header */}
            <div className="navbar bg-base-100 border-b border-base-300 shadow-sm px-4 py-3">
                <div className="flex-1 flex items-center">
                    <div className="avatar placeholder mr-3">
                        <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
                            {(selectedUser?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{selectedUser?.username || 'Unknown User'}</h2>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                            <p className="text-xs text-success">Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex-none">
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                            <MoreVertical className="w-5 h-5" />
                        </label>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a>View Profile</a></li>
                            <li><a>Search in Conversation</a></li>
                            <li><a>Mute Notifications</a></li>
                            <li><a>Clear History</a></li>
                            <li><a className="text-error">Block User</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-base-200 to-base-300">
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                )}

                {!isLoading && messages?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-6xl mb-4">👋</div>
                        <h3 className="text-xl font-semibold mb-2">Start your conversation!</h3>
                        <p className="text-base-content/70">Send a message to {selectedUser?.username}</p>
                    </div>
                )}

                {messages?.map((msg) => {
                    const senderId = (msg.sender as User)?._id || (msg.sender as string);
                    const senderUsername = (msg.sender as User)?.username || 'Unknown User';
                    const isCurrentUser = senderId === currentUserId;

                    return (
                        <div
                            key={msg._id}
                            className={`chat ${isCurrentUser ? 'chat-end' : 'chat-start'} animate-fade-in`}
                        >
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full bg-base-300 flex items-center justify-center text-lg font-bold">
                                    {senderUsername.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="chat-header text-xs text-base-content/50 mb-1">
                                {isCurrentUser ? 'You' : senderUsername}
                                <time className="ml-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </div>

                            {/* Content Rendering based on messageType */}
                            <div className={`chat-bubble ${isCurrentUser ? 'chat-bubble-primary' : 'bg-base-100 text-base-content'} max-w-xs md:max-w-md lg:max-w-lg shadow-md`}>
                                {msg.messageType === 'image' && (
                                    <div className="relative group cursor-pointer" onClick={() => openImageModal(msg.content)}>
                                        <img
                                            src={msg.content}
                                            alt="Chat Image"
                                            className="rounded-lg max-w-full h-auto max-h-64 object-cover transition-transform hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <div className="bg-white/90 rounded-full p-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {msg.messageType === 'video' && (
                                    <video
                                        src={msg.content}
                                        controls
                                        className="rounded-lg max-w-full max-h-64"
                                    />
                                )}

                                {msg.messageType === 'audio' && (
                                    <CustomAudioPlayer src={msg.content} isCurrentUser={isCurrentUser} />
                                )}

                                {msg.messageType === 'raw' && (
                                    <div className="flex items-center gap-2 p-2">
                                        <div className="bg-base-300 rounded-lg p-2">
                                            <Paperclip className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{'File Attachment'}</p>
                                            <p className="text-xs opacity-70">Click to download</p>
                                        </div>
                                        <a
                                            href={msg.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm btn-circle"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}

                                {msg.messageType === 'text' && (
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                            </div>

                            {isCurrentUser && (
                                <div className="chat-footer text-xs text-base-content/50 mt-1">
                                    <Check className="w-3 h-3 inline-block mr-1" /> Delivered
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {isReceiverTyping && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>

            {/* File & Audio Preview/Controls */}
            {(selectedFile || audioFileToUpload) && (
                <div className="p-2 bg-base-200 border-t border-base-300">
                    <div className="flex items-center gap-4 p-3 bg-base-100 rounded-xl shadow-md">
                        {/* Preview Content */}
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

                        {/* Upload Progress */}
                        {isUploading && (
                            <div className="w-24 bg-base-300 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}

                        {/* Remove Button */}
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

            {/* Message Input / Recorder Interface */}
            <div className="p-4 bg-base-100 border-t border-base-300">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">

                    {/* Recording Status / Input Field */}
                    <div className="flex-1 form-control relative">
                        {isRecording ? (
                            // Recording Indicator
                            <div className="flex items-center justify-start h-12 px-4 bg-error/10 text-error rounded-full shadow-inner">
                                <div className="w-3 h-3 bg-error rounded-full animate-pulse mr-2"></div>
                                <span className="font-mono text-sm">{formatTime(recordingTime)} Recording...</span>
                            </div>
                        ) : (
                            // Normal Input Field
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="input input-bordered input-primary flex-1 focus:outline-none rounded-full pr-16"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={handleInputChange}
                                    disabled={isUploading || !!audioFileToUpload || !!selectedFile}
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={isFileInputDisabled}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                                    {/* File Attachment Button */}
                                    <button
                                        type="button"
                                        className={`btn btn-circle btn-ghost btn-sm ${isFileInputDisabled ? 'btn-disabled' : ''}`}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isFileInputDisabled}
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    {/* Emoji Button */}
                                    <button type="button" className="btn btn-circle btn-ghost btn-sm">
                                        <Smile className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button: Send or Record/Stop */}
                    {isRecording ? (
                        // Stop Recording Button
                        <button
                            type="button"
                            className="btn btn-error btn-circle shadow-lg"
                            onClick={stopRecording}
                        >
                            <StopCircle className="w-6 h-6" />
                        </button>
                    ) : isReadyToSend ? (
                        // Send Button (for text, file, or ready audio)
                        <button
                            type="submit"
                            className={`btn btn-primary btn-circle shadow-lg ${isUploading ? 'btn-disabled' : ''}`}
                            disabled={!isReadyToSend || isUploading}
                        >
                            {isUploading ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    ) : (
                        // Start Recording Button (when input is empty)
                        <button
                            type="button"
                            className="btn btn-ghost btn-circle shadow-lg hover:bg-primary/10"
                            onClick={startRecording}
                            disabled={isUploading}
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
        </div>
    );
};

export default ChatPage;




