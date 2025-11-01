import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';

// Use a private module-level variable to maintain the singleton instance
let socketInstance: Socket | null = null;

// --- 1. Define the Store State and Actions Interface ---

export interface SocketState {
    /** The actual socket.io client instance. */
    socket: Socket | null;
    /** Function to establish a connection. */
    initializeSocket: (userId: string) => Socket;
    /** Function to close the connection. */
    disconnectSocket: () => void;
}

// --- 2. Create the Zustand Store ---

export const useSocketStore = create<SocketState>((set, get) => ({
    // Initial State
    socket: null,

    // --- Actions ---

    initializeSocket: (userId: string) => {
        // 1. Check if an instance already exists and is connected
        if (socketInstance && socketInstance.connected) {
            set({ socket: socketInstance }); // Update state just in case, but keep instance
            return socketInstance;
        }

        // 2. Clear any existing, disconnected instance to ensure a fresh start
        if (socketInstance) {
            socketInstance.disconnect();
        }

        console.log(`Attempting to connect socket for user: ${userId}`);

        // 3. Create the new socket instance (Singleton logic)
        const newSocket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            query: {
                userId: userId,
                // token: localStorage.getItem('accessToken') // Placeholder for actual auth
            },
            reconnectionAttempts: 5,
        });

        // 4. Update the module-level singleton and the store state
        socketInstance = newSocket;
        set({ socket: newSocket });

        // // 5. Optionally add connection logging/handling
        // newSocket.on('connect', () => {
        //     console.log('Socket connected successfully!');
        // });

        // newSocket.on('connect_error', (err) => {
        //     console.error('Socket connection error:', err.message);
        // });

        // newSocket.on('disconnect', (reason) => {
        //     console.log('Socket disconnected:', reason);
        //     // Optional: You might want to clear the state on disconnect
        //     // set({ socket: null });
        // });

        return socketInstance;
    },

    disconnectSocket: () => {
        // Use the instance from the store state
        const { socket } = get();

        if (socket && socket.connected) {
            console.log('Disconnecting socket...');
            socket.disconnect();
        }

        // Clear both the store state and the module-level singleton
        set({ socket: null });
        socketInstance = null;
    },
}));

// --- 3. Example Usage in a Component (Conceptual) ---
/*
// In your React component (e.g., App.tsx or Dashboard.tsx)

const { initializeSocket, disconnectSocket, socket } = useSocketStore();

useEffect(() => {
    // Replace 'user-123' with the actual authenticated user ID
    initializeSocket('user-123'); 

    // Clean up the connection when the component unmounts (or on user logout)
    return () => {
        disconnectSocket();
    };
}, [initializeSocket, disconnectSocket]);

// Now 'socket' in your component is the active Socket instance!
if (socket) {
    socket.emit('message', 'Hello from the store-managed socket!');
}
*/