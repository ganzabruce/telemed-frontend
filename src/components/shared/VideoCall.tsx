import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { createCallRoom } from '../../api/callsApi';

interface VideoCallProps {
  appointmentId: string;
  onClose: () => void;
  isVideoEnabled?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  appointmentId,
  onClose,
  isVideoEnabled = true,
}) => {
  const { socket, joinCallRoom, leaveCallRoom, sendWebRTCOffer, sendWebRTCAnswer, sendICECandidate } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingICECandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(isVideoEnabled);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const isInitiatorRef = useRef<boolean>(false);

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCallRoomInfo = (data: { id: string; occupants: number; otherParticipants: string[] }) => {
      console.log('Call room info:', data);
      setRoomId(data.id);
      if (data.otherParticipants.length > 0) {
        // There's already someone in the room, we're joining
        remoteSocketIdRef.current = data.otherParticipants[0];
        isInitiatorRef.current = false; // We're the answerer
        createPeerConnection();
      } else {
        // We're the first one, wait for peer to join
        isInitiatorRef.current = true; // We'll be the initiator
        setIsConnecting(true);
      }
    };

    const handlePeerJoined = (data: { socketId: string; userId: string; userName: string }) => {
      console.log('Peer joined:', data);
      remoteSocketIdRef.current = data.socketId;
      if (isInitiatorRef.current) {
        // We're the initiator (first one in the room), create connection and send offer
        console.log('We are the initiator, creating peer connection and sending offer');
        createPeerConnection();
      } else {
        // We're the answerer (joined after someone else), peer connection should already exist
        // But if it doesn't, create it (this handles the case where we joined before creating connection)
        if (!peerConnectionRef.current) {
          console.log('We are the answerer but no peer connection yet, creating it');
          createPeerConnection();
        } else {
          // Process any pending ICE candidates
          console.log('Processing pending ICE candidates');
          pendingICECandidatesRef.current.forEach(candidate => {
            if (candidate) {
              peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
            }
          });
          pendingICECandidatesRef.current = [];
        }
      }
    };

    const handleWebRTCOffer = async (data: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      console.log('Received WebRTC offer:', data);
      if (data.fromSocketId !== remoteSocketIdRef.current) {
        console.warn('Received offer from unexpected socket:', data.fromSocketId);
        return;
      }
      
      try {
        if (!peerConnectionRef.current) {
          isInitiatorRef.current = false;
          await createPeerConnection();
        }
        
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.description));
          const answer = await peerConnectionRef.current.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await peerConnectionRef.current.setLocalDescription(answer);
          console.log('Sending answer to:', data.fromSocketId);
          sendWebRTCAnswer(data.fromSocketId, answer);
        }
      } catch (error) {
        console.error('Error handling WebRTC offer:', error);
      }
    };

    const handleWebRTCAnswer = async (data: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      console.log('Received WebRTC answer:', data);
      if (data.fromSocketId !== remoteSocketIdRef.current) {
        console.warn('Received answer from unexpected socket:', data.fromSocketId);
        return;
      }
      
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.description));
          console.log('Remote description set from answer');
        } else {
          console.error('No peer connection when receiving answer');
        }
      } catch (error) {
        console.error('Error handling WebRTC answer:', error);
      }
    };

    const handleICECandidate = async (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      console.log('Received ICE candidate:', data);
      if (data.fromSocketId === remoteSocketIdRef.current && data.candidate) {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        } else {
          // Store candidate if peer connection not ready yet
          pendingICECandidatesRef.current.push(data.candidate);
        }
      }
    };

    const handlePeerLeft = () => {
      console.log('Peer left the call');
      onClose();
    };

    const handleCallError = (error: { message: string }) => {
      console.error('Call error:', error);
      alert(`Call error: ${error.message}`);
      onClose();
    };

    socket.on('callRoomInfo', handleCallRoomInfo);
    socket.on('peerJoined', handlePeerJoined);
    socket.on('webrtcOffer', handleWebRTCOffer);
    socket.on('webrtcAnswer', handleWebRTCAnswer);
    socket.on('iceCandidate', handleICECandidate);
    socket.on('peerLeft', handlePeerLeft);
    socket.on('callError', handleCallError);

    return () => {
      socket.off('callRoomInfo', handleCallRoomInfo);
      socket.off('peerJoined', handlePeerJoined);
      socket.off('webrtcOffer', handleWebRTCOffer);
      socket.off('webrtcAnswer', handleWebRTCAnswer);
      socket.off('iceCandidate', handleICECandidate);
      socket.off('peerLeft', handlePeerLeft);
      socket.off('callError', handleCallError);
    };
  }, [socket]);

  const initializeCall = async () => {
    try {
      // Create call room
      const { roomId: createdRoomId } = await createCallRoom(appointmentId);
      setRoomId(createdRoomId);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join call room
      joinCallRoom(createdRoomId);
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Failed to start call. Please check your camera and microphone permissions.');
      onClose();
    }
  };

  const createPeerConnection = async () => {
    try {
      // Don't create if already exists
      if (peerConnectionRef.current) {
        console.log('Peer connection already exists');
        return;
      }

      if (!remoteSocketIdRef.current) {
        console.log('No remote socket ID yet, waiting...');
        return;
      }

      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current!);
          console.log('Added local track:', track.kind, track.id);
        });
      } else {
        console.warn('No local stream available when creating peer connection');
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event);
        if (event.streams && event.streams.length > 0) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
            console.log('Remote stream set on video element');
          }
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && remoteSocketIdRef.current) {
          console.log('Sending ICE candidate:', event.candidate);
          sendICECandidate(remoteSocketIdRef.current, event.candidate.toJSON());
        } else if (!event.candidate) {
          console.log('ICE gathering complete');
        }
      };

      // Handle ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
          setIsConnecting(false);
        } else if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
          console.error('ICE connection failed or disconnected');
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
          console.error('Peer connection failed or disconnected');
          // Don't close immediately, wait a bit for reconnection
          setTimeout(() => {
            if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
              onClose();
            }
          }, 3000);
        }
      };

      // Process any pending ICE candidates
      if (pendingICECandidatesRef.current.length > 0) {
        console.log('Processing pending ICE candidates:', pendingICECandidatesRef.current.length);
        for (const candidate of pendingICECandidatesRef.current) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding pending ICE candidate:', error);
          }
        }
        pendingICECandidatesRef.current = [];
      }

      // Create and send offer if we're the initiator
      if (isInitiatorRef.current && remoteSocketIdRef.current) {
        console.log('Creating offer as initiator');
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);
        console.log('Sending offer to:', remoteSocketIdRef.current);
        sendWebRTCOffer(remoteSocketIdRef.current, offer);
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
      alert('Failed to establish connection. Please try again.');
      onClose();
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    console.log('Cleaning up video call resources');
    
    // Leave call room
    if (roomId) {
      leaveCallRoom(roomId);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    remoteSocketIdRef.current = null;
    pendingICECandidatesRef.current = [];
    isInitiatorRef.current = false;
  };

  const handleEndCall = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Remote video */}
        <div className="flex-1 relative bg-gray-900">
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Local video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full ${
              isAudioOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'
            } hover:bg-opacity-80 transition-colors`}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'
            } hover:bg-opacity-80 transition-colors`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 left-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;

