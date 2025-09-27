import React, { useRef, useEffect, useState } from 'react'
import Peer from 'simple-peer'
import { socketService } from '../services/socket'
import { User } from '@skype-clone/shared'

interface VideoCallProps {
  callId: string
  caller: User
  receiver?: User
  isIncoming: boolean
  onAccept: () => void
  onDecline: () => void
  onEnd: () => void
}

const VideoCall: React.FC<VideoCallProps> = ({
  callId,
  caller,
  receiver,
  isIncoming,
  onAccept,
  onDecline,
  onEnd
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [callAccepted, setCallAccepted] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [peer, setPeer] = useState<Peer.Instance | null>(null)

  const myVideo = useRef<HTMLVideoElement>(null)
  const userVideo = useRef<HTMLVideoElement>(null)
  const connectionRef = useRef<Peer.Instance | null>(null)

  useEffect(() => {
    if (isIncoming) {
      // For incoming calls, wait for user to accept
      return
    }

    // For outgoing calls, immediately start media stream
    startMediaStream()
  }, [isIncoming])

  useEffect(() => {
    // Listen for WebRTC events
    socketService.onWebRTCOffer(handleOffer)
    socketService.onWebRTCAnswer(handleAnswer)
    socketService.onWebRTCIceCandidate(handleIceCandidate)
    socketService.onCallAccepted(handleCallAccepted)
    socketService.onCallDeclined(handleCallDeclined)
    socketService.onCallEnded(handleCallEnded)

    return () => {
      socketService.getSocket()?.off('webrtc:offer', handleOffer)
      socketService.getSocket()?.off('webrtc:answer', handleAnswer)
      socketService.getSocket()?.off('webrtc:ice-candidate', handleIceCandidate)
      socketService.getSocket()?.off('call:accepted', handleCallAccepted)
      socketService.getSocket()?.off('call:declined', handleCallDeclined)
      socketService.getSocket()?.off('call:ended', handleCallEnded)
    }
  }, [])

  useEffect(() => {
    if (callEnded) {
      cleanup()
    }
  }, [callEnded])

  const startMediaStream = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setStream(currentStream)

      if (myVideo.current) {
        myVideo.current.srcObject = currentStream
      }
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const handleOffer = (offer: any) => {
    if (offer.callId === callId) {
      createPeer(false, offer.signal)
    }
  }

  const handleAnswer = (answer: any) => {
    if (answer.callId === callId) {
      connectionRef.current?.signal(answer.signal)
    }
  }

  const handleIceCandidate = (candidate: any) => {
    if (candidate.callId === callId) {
      connectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate.candidate))
    }
  }

  const handleCallAccepted = (acceptedCallId: string) => {
    if (acceptedCallId === callId) {
      setCallAccepted(true)
      startMediaStream()
    }
  }

  const handleCallDeclined = (declinedCallId: string) => {
    if (declinedCallId === callId) {
      setCallEnded(true)
    }
  }

  const handleCallEnded = (endedCallId: string) => {
    if (endedCallId === callId) {
      setCallEnded(true)
    }
  }

  const createPeer = (initiator: boolean, signalData?: any) => {
    const newPeer = new Peer({
      initiator,
      trickle: false,
      stream: stream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    })

    newPeer.on('signal', (data) => {
      if (initiator) {
        socketService.sendWebRTCOffer({
          type: 'offer',
          sdp: data,
          callId,
          callerId: caller.id,
          receiverId: receiver?.id
        })
      } else {
        socketService.sendWebRTCAnswer({
          type: 'answer',
          sdp: data,
          callId,
          callerId: caller.id
        })
      }
    })

    newPeer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream
      }
    })

    newPeer.on('connect', () => {
      setCallAccepted(true)
    })

    newPeer.on('error', (error) => {
      console.error('Peer connection error:', error)
      setCallEnded(true)
    })

    newPeer.on('close', () => {
      setCallEnded(true)
    })

    if (signalData) {
      newPeer.signal(signalData)
    }

    connectionRef.current = newPeer
    setPeer(newPeer)
  }

  const acceptCall = () => {
    startMediaStream()
    setCallAccepted(true)
    onAccept()

    // Create peer as receiver
    createPeer(false)
  }

  const declineCall = () => {
    setCallEnded(true)
    onDecline()
  }

  const endCall = () => {
    setCallEnded(true)
    onEnd()
  }

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (connectionRef.current) {
      connectionRef.current.destroy()
    }
    if (peer) {
      peer.destroy()
    }
  }

  if (callEnded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Call Ended</h3>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return to Chat
          </button>
        </div>
      </div>
    )
  }

  if (isIncoming && !callAccepted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-sm w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📞</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Incoming Call</h3>
            <p className="text-gray-600 mb-6">
              {caller.firstName} {caller.lastName} is calling
            </p>
            <div className="flex space-x-4">
              <button
                onClick={declineCall}
                className="flex-1 bg-red-500 text-white py-3 px-4 rounded hover:bg-red-600"
              >
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {caller.firstName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {caller.firstName} {caller.lastName}
            </h3>
            <p className="text-gray-300 text-sm">
              {callAccepted ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={endCall}
          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7H3l3-3m0 0l3 3H7a5 5 0 015 5m0 0a5 5 0 01-5-5m5 5v6m0 0l3-3m-3 3l-3-3" />
          </svg>
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex">
        {/* Main Video */}
        <div className="flex-1 relative">
          <video
            ref={userVideo}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!callAccepted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}
        </div>

        {/* Self Video (Small) */}
        <div className="w-48 h-36 m-4 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={myVideo}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-2.828a9 9 0 010-12.728M9 9l6 6m0-6l-6 6" />
          </svg>
        </button>
        <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default VideoCall
