
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// We export a function that either returns a connected socket OR null,
// or we make the connecting component responsible for calling this.

let socket: Socket | null = null;

/**
 * Initializes and returns a singleton socket instance.
 * @param userId - The ID of the user to authenticate the socket connection.
 * @returns The socket instance or null if userId is not provided.
 */
export const initializeSocket = (userId: string): Socket | null => {
    // If the socket is already created, return it (to prevent multiple connections)
    if (socket) return socket;
    
    // const accessToken = localStorage.getItem('accessToken');
    
    // Create the socket connection
    socket = io('http://localhost:3000', {
        transports: ['websocket','polling'],
        query: {
            userId: userId, // Pass the actual ID
            // Consider passing the accessToken here too, for better auth
            // token: accessToken 
        }
    });

    return socket;
};

// Export the helper store, but you should import and use the function above 
// in a component (like App.tsx or Dashboard.tsx)
