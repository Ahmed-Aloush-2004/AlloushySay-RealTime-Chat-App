import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Camera, Phone, Video, Mic, X } from 'lucide-react';

// --- Configuration ---
// IMPORTANT: Replace this with your actual NestJS Signaling Server URL
const SIGNALING_SERVER_URL = 'http://localhost:3001'; 
// A public STUN server is provided by Google for discovery. TURN is usually required for production.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]; 

/**
 * Custom Hook to manage the RTCPeerConnection and streams.
 */
const useWebRTC = (roomId, remoteVideoRef, localVideoRef, isCallActive) => {
    // Refs for persistent objects and streams
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);

    // State for UI
    const [status, setStatus] = useState('Idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    // --- Core WebRTC Functions ---

    /**
     * Initializes the Socket.IO connection and sets up signaling handlers.
     */
    const initSocket = () => {
        if (!socketRef.current) {
            socketRef.current = io(SIGNALING_SERVER_URL);

            socketRef.current.on('connect', () => {
                console.log('Connected to signaling server');
                // The client immediately tries to join a room upon connection
                socketRef.current.emit('join_room', roomId);
                setStatus('Connected to server. Waiting for peer...');
            });

            // 1. Peer joined the room, now we can try to start the call
            socketRef.current.on('room_ready', (isInitiator) => {
                setStatus(isInitiator ? 'Ready. Initializing call...' : 'Ready. Receiving offer...');
                initPeerConnection(isInitiator);
            });

            // 2. Caller receives the Answer
            socketRef.current.on('answer', async (answer) => {
                console.log('Received Answer:', answer.type);
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setStatus('Call established.');
            });

            // 3. Callee receives the Offer
            socketRef.current.on('offer', async (offer) => {
                console.log('Received Offer:', offer.type);
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                socketRef.current.emit('answer', { roomId, answer });
                setStatus('Call established.');
            });

            // 4. Exchanging ICE Candidates
            socketRef.current.on('candidate', async (candidate) => {
                try {
                    if (candidate) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('Added remote ICE candidate.');
                    }
                } catch (e) {
                    console.error('Error adding received ICE candidate', e);
                }
            });

            socketRef.current.on('peer_disconnected', () => {
                setStatus('Peer has disconnected. Call ended.');
                if (peerConnectionRef.current) {
                    peerConnectionRef.current.close();
                    peerConnectionRef.current = null;
                }
                // Clear remote video
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                localVideoRef.current.srcObject = null;
            });
            
            socketRef.current.on('error', (err) => {
                console.error('Socket Error:', err);
                setStatus('Connection Error.');
            });
        }
    };

    /**
     * Initializes RTCPeerConnection and sets up event handlers.
     * @param {boolean} isInitiator - True if this peer starts the call (the 'Caller').
     */
    const initPeerConnection = async (isInitiator) => {
        if (peerConnectionRef.current) return;

        peerConnectionRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // 1. ICE Candidate Handler (Networking)
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                // Send candidate to the remote peer via the signaling server
                socketRef.current.emit('candidate', { roomId, candidate: event.candidate });
                console.log('Sent ICE candidate:', event.candidate.type);
            }
        };

        // 2. Remote Track Handler (Media Reception)
        peerConnectionRef.current.ontrack = (event) => {
            console.log('Received remote track.');
            if (remoteVideoRef.current && event.streams[0]) {
                // Attach the remote stream to the video element
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // 3. Add local media tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
            });
        }

        // 4. Start the negotiation if this peer is the caller
        if (isInitiator) {
            try {
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
                // Send the Offer to the signaling server
                socketRef.current.emit('offer', { roomId, offer });
            } catch (error) {
                console.error('Error creating or sending offer:', error);
            }
        }
    };

    /**
     * Toggles the local audio track (Mute/Unmute).
     */
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    /**
     * Toggles the local video track (Camera On/Off).
     */
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isCameraOff;
                setIsCameraOff(!isCameraOff);
            }
        }
    };

    /**
     * Cleans up the connection and streams.
     */
    const hangUp = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setStatus('Disconnected');
    };

    // --- Effects (Lifecycle Management) ---

    // Effect to get local media stream on mount
    useEffect(() => {
        const getLocalMedia = async () => {
            try {
                // Why: Request camera/mic access from the user
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                initSocket();
            } catch (error) {
                console.error('Error accessing media devices:', error);
                setStatus('Media Error: Please allow camera and mic access.');
            }
        };

        getLocalMedia();

        // Cleanup function on unmount
        return () => hangUp();
    }, [roomId, isCallActive]);


    return { status, isMuted, isCameraOff, toggleMute, toggleVideo, hangUp };
};