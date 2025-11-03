import React from 'react';
import { Image, Download } from 'lucide-react';
import { CustomAudioPlayer } from './CustomAudioPlayer';
import { getFileIcon } from '../utils/formatters';
import type { Message } from '../common/interfaces/message';

interface MessageComponentProps {
    msg: Message;
    isCurrentUser: boolean;
    onImageClick: (src: string) => void;
    onReplyClick: (msg: Message) => void;
    onMarkAsRead: (messageId: string) => void;
}

export const MessageComponent: React.FC<MessageComponentProps> = ({
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
                            {(() => {
                                const FileIconComponent = getFileIcon(msg.fileType || 'application/octet-stream');
                                return <FileIconComponent />;
                            })()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{msg.fileName || 'File Attachment'}</p>
                            <p className="text-xs opacity-70">Click to download</p>
                        </div>
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = msg.content;
                                link.download = msg.fileName || 'file';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="btn btn-ghost btn-sm btn-circle"
                        >
                            <Download className="w-4 h-4" />
                        </button>
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