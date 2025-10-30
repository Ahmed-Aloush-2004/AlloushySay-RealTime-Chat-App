// // // src/components/VideoCall.tsx

// // import React, { useState, useEffect, useRef } from 'react';
// // import io, { Socket } from 'socket.io-client';

// // const SERVER_URL = 'http://localhost:3000';

// // // Define the type for the payload of an incoming call
// // interface IncomingCallPayload {
// //   signal: any; // In a real app, you might type this more strictly
// //   from: string;
// // }

// // const VideoCall: React.FC = () => {
// //   // State with TypeScript types
// //   const [socket, setSocket] = useState<Socket | null>(null);
// //   const [myID, setMyID] = useState<string>('');
// //   const [remoteID, setRemoteID] = useState<string>('');
// //   const [stream, setStream] = useState<MediaStream | null>(null);
// //   const [receivingCall, setReceivingCall] = useState<boolean>(false);
// //   const [caller, setCaller] = useState<string>('');
// //   const [callerSignal, setCallerSignal] = useState<any>(null); // `any` is used for simplicity here
// //   const [callAccepted, setCallAccepted] = useState<boolean>(false);

// //   // Refs with TypeScript types
// //   const myVideo = useRef<HTMLVideoElement>(null);
// //   const userVideo = useRef<HTMLVideoElement>(null);
// //   const connectionRef = useRef<RTCPeerConnection | null>(null);

// //   useEffect(() => {
// //     const newSocket = io(SERVER_URL);
// //     setSocket(newSocket);

// //     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
// //       .then(currentStream => {
// //         setStream(currentStream);
// //         if (myVideo.current) {
// //           myVideo.current.srcObject = currentStream;
// //         }
// //       })
// //       .catch(err => console.error("Error accessing media devices:", err));

// //     newSocket.on('yourID', (id: string) => {
// //       setMyID(id);
// //     });

// //     newSocket.on('incomingCall', (data: IncomingCallPayload) => {
// //       setReceivingCall(true);
// //       setCaller(data.from);
// //       setCallerSignal(data.signal);
// //     });

// //     return () => newSocket.close();
// //   }, []);

// //   const callUser = (id: string) => {
// //     console.log('hi!!!!!!!');
    
// //     const peer = createPeer();
// //     peer.on('signal', (data) => {
// //       socket?.emit('callUser', { userToCall: id, signalData: data, from: myID });
// //     });
// //     peer.on('stream', (currentStream) => {
// //       if (userVideo.current) {
// //         userVideo.current.srcObject = currentStream;
// //       }
// //     });
// //     stream?.getTracks().forEach(track => peer.addTrack(track, stream));
// //     connectionRef.current = peer;
// //   };

// //   const createPeer = (): RTCPeerConnection => {
// //     const peer = new RTCPeerConnection({
// //       iceServers: [
// //         { urls: 'stun:stun.l.google.com:19302' },
// //       ],
// //     });
    
// //     return peer;
// //   };

// //   const acceptCall = () => {
// //     setCallAccepted(true);
// //     const peer = createPeer();
// //     peer.on('signal', (data) => {
// //       socket?.emit('answerCall', { signal: data, to: caller });
// //     });
// //     peer.on('stream', (currentStream) => {
// //       if (userVideo.current) {
// //         userVideo.current.srcObject = currentStream;
// //       }
// //     });
// //     peer.signal(callerSignal);
// //     stream?.getTracks().forEach(track => peer.addTrack(track, stream));
// //     connectionRef.current = peer;
// //   };

// //   return (
// //     <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
// //       <h1 className="text-4xl font-bold mb-6">WebRTC Video Call</h1>
      
// //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
// //         {/* My Video Card */}
// //         <div className="card bg-base-100 shadow-xl">
// //           <figure className="aspect-video bg-base-300">
// //             <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
// //           </figure>
// //           <div className="card-body">
// //             <h2 className="card-title justify-center">My Video</h2>
// //             <p className="text-center text-sm">Your ID: <span className="font-mono font-bold">{myID}</span></p>
// //           </div>
// //         </div>

// //         {/* Remote Video Card */}
// //         <div className="card bg-base-100 shadow-xl">
// //           <figure className="aspect-video bg-base-300">
// //             {callAccepted ? (
// //               <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
// //             ) : receivingCall ? (
// //               <div className="flex items-center justify-center h-full text-center p-4">
// //                  <div className="alert alert-info">
// //                   <span>{caller} is calling you...</span>
// //                 </div>
// //               </div>
// //             ) : (
// //               <div className="flex items-center justify-center h-full text-center p-4">
// //                 <p>Waiting for a call...</p>
// //               </div>
// //             )}
// //           </figure>
// //           <div className="card-body">
// //             <h2 className="card-title justify-center">Remote Video</h2>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Controls */}
// //       <div className="card bg-base-100 shadow-xl mt-6 w-full max-w-md">
// //         <div className="card-body">
// //           <div className="form-control">
// //             <label className="label">
// //               <span className="label-text">ID to call</span>
// //             </label>
// //             <div className="input-group">
// //               <input
// //                 type="text"
// //                 placeholder="Enter remote ID"
// //                 className="input input-bordered flex-grow"
// //                 value={remoteID}
// //                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteID(e.target.value)}
// //               />
// //               {receivingCall && !callAccepted ? (
// //                 <button className="btn btn-success" onClick={acceptCall}>
// //                   Answer
// //                 </button>
// //               ) : (
// //                 <button 
// //                   className="btn btn-primary" 
// //                   onClick={() => callUser(remoteID)}
// //                   disabled={!remoteID || callAccepted}
// //                 >
// //                   Call
// //                 </button>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default VideoCall;



// // src/components/VideoCall.tsx

// import React, { useState, useEffect, useRef } from 'react';
// import io, { Socket } from 'socket.io-client';
// // Import the simple-peer library
// import Peer from 'simple-peer';

// // FIX 1: Point to the correct server URL
// const SERVER_URL = 'http://localhost:3000';

// // Define the type for the payload of an incoming call
// interface IncomingCallPayload {
//   signal: any;
//   from: string;
// }

// const VideoCall: React.FC = () => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [myID, setMyID] = useState<string>('');
//   const [remoteID, setRemoteID] = useState<string>('');
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [receivingCall, setReceivingCall] = useState<boolean>(false);
//   const [caller, setCaller] = useState<string>('');
//   const [callerSignal, setCallerSignal] = useState<any>(null);
//   const [callAccepted, setCallAccepted] = useState<boolean>(false);
//   const [callEnded, setCallEnded] = useState<boolean>(false); // Added for a "Leave" button

//   const myVideo = useRef<HTMLVideoElement>(null);
//   const userVideo = useRef<HTMLVideoElement>(null);
//   const connectionRef = useRef<Peer.Instance | null>(null); // Use Peer.Instance type

//   useEffect(() => {
//     const newSocket = io(SERVER_URL);
//     setSocket(newSocket);

//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then(currentStream => {
//         setStream(currentStream);
//         if (myVideo.current) {
//           myVideo.current.srcObject = currentStream;
//         }
//       })
//       .catch(err => console.error("Error accessing media devices:", err));

//     newSocket.on('yourID', (id: string) => {
//       setMyID(id);
//     });

//     newSocket.on('incomingCall', (data: IncomingCallPayload) => {
//       setReceivingCall(true);
//       setCaller(data.from);
//       setCallerSignal(data.signal);
//     });

//     return () => newSocket.close();
//   }, []);

//   const callUser = (id: string) => {
//     // FIX 2: Use simple-peer to create the connection
//     const peer = new Peer({ initiator: true, trickle: false, stream: stream! });
    
//     peer.on('signal', (data) => {
//       socket?.emit('callUser', { userToCall: id, signalData: data, from: myID });
//     });

//     peer.on('stream', (currentStream) => {
//       if (userVideo.current) {
//         userVideo.current.srcObject = currentStream;
//       }
//     });

//     socket?.on('callAccepted', (signal) => {
//       peer.signal(signal);
//     });

//     connectionRef.current = peer;
//   };

//   const acceptCall = () => {
//     setCallAccepted(true);
//     // FIX 2: Use simple-peer to create the connection
//     const peer = new Peer({ initiator: false, trickle: false, stream: stream! });

//     peer.on('signal', (data) => {
//       socket?.emit('answerCall', { signal: data, to: caller });
//     });

//     peer.on('stream', (currentStream) => {
//       if (userVideo.current) {
//         userVideo.current.srcObject = currentStream;
//       }
//     });

//     peer.signal(callerSignal);
//     connectionRef.current = peer;
//   };
  
//   // A helper function to end the call
//   const leaveCall = () => {
//     setCallEnded(true);
//     connectionRef.current?.destroy();
//     window.location.reload();
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
//       <h1 className="text-4xl font-bold mb-6">WebRTC Video Call</h1>
      
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
//         {/* My Video Card */}
//         <div className="card bg-base-100 shadow-xl">
//           <figure className="aspect-video bg-base-300">
//             <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
//           </figure>
//           <div className="card-body">
//             <h2 className="card-title justify-center">My Video</h2>
//             <p className="text-center text-sm">Your ID: <span className="font-mono font-bold">{myID}</span></p>
//           </div>
//         </div>

//         {/* Remote Video Card */}
//         <div className="card bg-base-100 shadow-xl">
//           <figure className="aspect-video bg-base-300">
//             {callAccepted && !callAccepted ? (
//               <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
//             ) : receivingCall ? (
//               <div className="flex items-center justify-center h-full text-center p-4">
//                  <div className="alert alert-info">
//                   <span>{caller} is calling you...</span>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-center p-4">
//                 <p>Waiting for a call...</p>
//               </div>
//             )}
//           </figure>
//           <div className="card-body">
//             <h2 className="card-title justify-center">Remote Video</h2>
//           </div>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="card bg-base-100 shadow-xl mt-6 w-full max-w-md">
//         <div className="card-body">
//           <div className="form-control">
//             <label className="label">
//               <span className="label-text">ID to call</span>
//             </label>
//             <div className="input-group">
//               <input
//                 type="text"
//                 placeholder="Enter remote ID"
//                 className="input input-bordered flex-grow"
//                 value={remoteID}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteID(e.target.value)}
//               />
//               {callAccepted && !callEnded ? (
//                 <button className="btn btn-error" onClick={leaveCall}>
//                   Leave Call
//                 </button>
//               ) : receivingCall && !callAccepted ? (
//                 <button className="btn btn-success" onClick={acceptCall}>
//                   Answer
//                 </button>
//               ) : (
//                 <button 
//                   className="btn btn-primary" 
//                   onClick={() => callUser(remoteID)}
//                   disabled={!remoteID || callAccepted}
//                 >
//                   Call
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;