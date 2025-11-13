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
  const { socket, joinCallRoom, sendWebRTCOffer, sendWebRTCAnswer, sendICECandidate } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(isVideoEnabled);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [_roomId, setRoomId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

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
        remoteSocketIdRef.current = data.otherParticipants[0];
        createPeerConnection();
      } else {
        // We're the first one, wait for peer to join
        setIsConnecting(true);
      }
    };

    const handlePeerJoined = (data: { socketId: string; userId: string; userName: string }) => {
      console.log('Peer joined:', data);
      remoteSocketIdRef.current = data.socketId;
      createPeerConnection();
    };

    const handleWebRTCOffer = async (data: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      console.log('Received WebRTC offer:', data);
      if (!peerConnectionRef.current) {
        await createPeerConnection();
      }
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(data.description));
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      sendWebRTCAnswer(data.fromSocketId, answer);
    };

    const handleWebRTCAnswer = async (data: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      console.log('Received WebRTC answer:', data);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.description));
      }
    };

    const handleICECandidate = async (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      console.log('Received ICE candidate:', data);
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    const handlePeerLeft = () => {
      console.log('Peer left the call');
      onClose();
    };

    socket.on('callRoomInfo', handleCallRoomInfo);
    socket.on('peerJoined', handlePeerJoined);
    socket.on('webrtcOffer', handleWebRTCOffer);
    socket.on('webrtcAnswer', handleWebRTCAnswer);
    socket.on('iceCandidate', handleICECandidate);
    socket.on('peerLeft', handlePeerLeft);

    return () => {
      socket.off('callRoomInfo', handleCallRoomInfo);
      socket.off('peerJoined', handlePeerJoined);
      socket.off('webrtcOffer', handleWebRTCOffer);
      socket.off('webrtcAnswer', handleWebRTCAnswer);
      socket.off('iceCandidate', handleICECandidate);
      socket.off('peerLeft', handlePeerLeft);
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
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && remoteSocketIdRef.current) {
          sendICECandidate(remoteSocketIdRef.current, event.candidate.toJSON());
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
          onClose();
        }
      };

      // Create and send offer if we're the first one
      if (remoteSocketIdRef.current) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendWebRTCOffer(remoteSocketIdRef.current, offer);
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
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

