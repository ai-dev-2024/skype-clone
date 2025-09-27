import { io, Socket } from 'socket.io-client'
import { ServerToClientEvents, ClientToServerEvents } from '@skype-clone/shared'

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

  connect(userId: string, token: string) {
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token
      }
    })

    this.socket.on('connect', () => {
      console.log('Connected to socket server')
      this.socket?.emit('user:connect', userId)
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  // Event listeners
  onMessage(handler: (message: any) => void) {
    this.socket?.on('message:new', handler)
  }

  onMessageRead(handler: (messageId: string) => void) {
    this.socket?.on('message:read', handler)
  }

  onUserOnline(handler: (user: any) => void) {
    this.socket?.on('user:online', handler)
  }

  onUserOffline(handler: (userId: string) => void) {
    this.socket?.on('user:offline', handler)
  }

  onCallIncoming(handler: (call: any) => void) {
    this.socket?.on('call:incoming', handler)
  }

  onCallAccepted(handler: (callId: string) => void) {
    this.socket?.on('call:accepted', handler)
  }

  onCallDeclined(handler: (callId: string) => void) {
    this.socket?.on('call:declined', handler)
  }

  onCallEnded(handler: (callId: string) => void) {
    this.socket?.on('call:ended', handler)
  }

  onGroupCreated(handler: (group: any) => void) {
    this.socket?.on('group:created', handler)
  }

  onGroupMemberAdded(handler: (groupId: string, userId: string) => void) {
    this.socket?.on('group:member:added', handler)
  }

  onGroupMemberRemoved(handler: (groupId: string, userId: string) => void) {
    this.socket?.on('group:member:removed', handler)
  }

  // Event emitters
  sendMessage(message: any) {
    this.socket?.emit('message:send', message)
  }

  markMessageAsRead(messageId: string) {
    this.socket?.emit('message:mark-read', messageId)
  }

  initiateCall(callData: any) {
    this.socket?.emit('call:initiate', callData)
  }

  acceptCall(callId: string) {
    this.socket?.emit('call:accept', callId)
  }

  declineCall(callId: string) {
    this.socket?.emit('call:decline', callId)
  }

  endCall(callId: string) {
    this.socket?.emit('call:end', callId)
  }

  createGroup(groupData: any) {
    this.socket?.emit('group:create', groupData)
  }

  joinGroup(groupId: string) {
    this.socket?.emit('group:join', groupId)
  }

  leaveGroup(groupId: string) {
    this.socket?.emit('group:leave', groupId)
  }

  sendContactRequest(contactId: string) {
    this.socket?.emit('contact:add', contactId)
  }

  acceptContactRequest(contactId: string) {
    this.socket?.emit('contact:accept', contactId)
  }

  blockContact(contactId: string) {
    this.socket?.emit('contact:block', contactId)
  }

  // Message reactions
  addMessageReaction(messageId: string, reaction: string) {
    this.socket?.emit('message:add-reaction', messageId, reaction)
  }

  removeMessageReaction(messageId: string, reaction: string) {
    this.socket?.emit('message:remove-reaction', messageId, reaction)
  }

  // WebRTC events
  sendWebRTCOffer(offer: any) {
    this.socket?.emit('webrtc:offer', offer)
  }

  sendWebRTCAnswer(answer: any) {
    this.socket?.emit('webrtc:answer', answer)
  }

  sendWebRTCIceCandidate(candidate: any) {
    this.socket?.emit('webrtc:ice-candidate', candidate)
  }

  // WebRTC event listeners
  onWebRTCOffer(handler: (offer: any) => void) {
    this.socket?.on('webrtc:offer', handler)
  }

  onWebRTCAnswer(handler: (answer: any) => void) {
    this.socket?.on('webrtc:answer', handler)
  }

  onWebRTCIceCandidate(handler: (candidate: any) => void) {
    this.socket?.on('webrtc:ice-candidate', candidate)
  }

  onCallAccepted(handler: (callId: string) => void) {
    this.socket?.on('call:accepted', handler)
  }

  onCallDeclined(handler: (callId: string) => void) {
    this.socket?.on('call:declined', handler)
  }

  onCallEnded(handler: (callId: string) => void) {
    this.socket?.on('call:ended', handler)
  }
}

export const socketService = new SocketService()
export default socketService
