// --- Typing Indicator Component ---
const TypingIndicator: React.FC = () => (
    <div className="chat chat-start">
        <div className="chat-image avatar">
            <div className="w-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold">
                U
            </div>
        </div>
        <div className="chat-header text-sm text-gray-600">
            Typing...
        </div>
        <div className="chat-bubble bg-white text-gray-800 shadow-md border border-gray-200 w-16">
            <div className="flex space-x-1 justify-center items-center">
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
        </div>
    </div>
);

export default TypingIndicator;