import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { socketService } from '../services/socket'
import { contactsAPI, messagesAPI, callsAPI } from '../services/api'
import VideoCall from '../components/VideoCall'
import FileUpload from '../components/FileUpload'
import ThemeToggle from '../components/ThemeToggle'
import MessageReactions from '../components/MessageReactions'
import { User, Message, Call, MessageReaction } from '@skype-clone/shared'
import toast from 'react-hot-toast'

const Chat = () => {
  const { chatId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [contact, setContact] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId && user) {
      loadChatData()
      setupSocketListeners()
    }

    return () => {
      socketService.getSocket()?.off('message:new')
      socketService.getSocket()?.off('call:incoming')
    }
  }, [chatId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    try {
      setLoading(true)

      // Get contact info
      const contactsResponse = await contactsAPI.getContacts()
      const foundContact = contactsResponse.data.find((c: any) =>
        c.contactId.id === chatId
      )

      if (foundContact) {
        setContact(foundContact.contactId)
      }

      // Get messages
      const messagesResponse = await messagesAPI.getConversation(chatId!)
      setMessages(messagesResponse.data)
    } catch (error) {
      toast.error('Failed to load chat data')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const setupSocketListeners = () => {
    socketService.onMessage((message: Message) => {
      if (message.senderId === chatId || message.receiverId === chatId) {
        setMessages(prev => [...prev, message])
      }
    })

    socketService.onCallIncoming((call: Call) => {
      if (call.callerId === chatId || call.receiverId === chatId) {
        setActiveCall(call)
        setIsIncomingCall(true)
      }
    })

    // Listen for reaction events
    socketService.getSocket()?.on('message:reaction:added', (reaction: MessageReaction) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === reaction.messageId) {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), reaction]
          }
        }
        return msg
      }))
    })

    socketService.getSocket()?.on('message:reaction:removed', (messageId: string, userId: string, reactionType: string) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r =>
              !(r.userId === userId && r.reaction === reactionType)
            )
          }
        }
        return msg
      }))
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await messagesAPI.sendMessage({
        receiverId: chatId,
        content: newMessage,
        type: 'text'
      })

      setNewMessage('')
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const startCall = async (type: 'audio' | 'video') => {
    try {
      const callResponse = await callsAPI.initiateCall({
        receiverId: chatId,
        type
      })

      setActiveCall(callResponse.data)
      setIsIncomingCall(false)
    } catch (error) {
      toast.error('Failed to start call')
    }
  }

  const acceptCall = async () => {
    if (!activeCall) return

    try {
      await callsAPI.acceptCall(activeCall.id)
      setIsIncomingCall(false)
    } catch (error) {
      toast.error('Failed to accept call')
    }
  }

  const declineCall = async () => {
    if (!activeCall) return

    try {
      await callsAPI.declineCall(activeCall.id)
      setActiveCall(null)
      setIsIncomingCall(false)
    } catch (error) {
      toast.error('Failed to decline call')
    }
  }

  const endCall = async () => {
    if (!activeCall) return

    try {
      await callsAPI.endCall(activeCall.id)
      setActiveCall(null)
      setIsIncomingCall(false)
    } catch (error) {
      toast.error('Failed to end call')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-xl mb-4">Contact not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Chat Header */}
      <header className="p-4 flex justify-between items-center" style={{ backgroundColor: 'var(--bg-chat-header)' }} role="banner">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="hover:text-blue-400 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Go back to dashboard"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${contact.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
              aria-label={contact.isOnline ? 'User is online' : 'User is offline'}
            ></div>
            <div>
              <h1 className="font-semibold" id="chat-partner-name">
                {contact.firstName} {contact.lastName}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                @{contact.username} • {contact.isOnline ? 'Online' : `Last seen ${new Date(contact.lastSeen).toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <ThemeToggle />
          <button
            onClick={() => startCall('audio')}
            className="bg-green-600 hover:bg-green-700 p-2 rounded-full transition-colors"
            aria-label={`Start voice call with ${contact.firstName} ${contact.lastName}`}
            title="Voice Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button
            onClick={() => startCall('video')}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
            aria-label={`Start video call with ${contact.firstName} ${contact.lastName}`}
            title="Video Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <article
              className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
              style={{
                backgroundColor: message.senderId === user?.id ? 'var(--bg-message-sent)' : 'var(--bg-message-received)',
                color: message.senderId === user?.id ? 'var(--text-message-sent)' : 'var(--text-message-received)'
              }}
              aria-label={`Message from ${message.senderId === user?.id ? 'you' : contact.firstName}`}
            >
              {message.type === 'text' && <p>{message.content}</p>}
              {message.type === 'image' && message.fileUrl && (
                <div>
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || 'Image'}
                    className="max-w-full h-auto rounded"
                  />
                  {message.content && <p className="mt-2">{message.content}</p>}
                </div>
              )}
              {message.type === 'file' && message.fileUrl && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium">{message.fileName}</p>
                      <p className="text-xs opacity-70">
                        {message.fileSize && `${(message.fileSize / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  {message.content && <p>{message.content}</p>}
                  <button
                    onClick={() => window.open(message.fileUrl, '_blank')}
                    className="text-blue-300 hover:text-blue-200 text-sm underline"
                  >
                    Download
                  </button>
                </div>
              )}
              {(message.type === 'audio' || message.type === 'video') && message.fileUrl && (
                <div>
                  <video
                    controls
                    className="max-w-full h-auto rounded"
                    src={message.fileUrl}
                  />
                  {message.content && <p className="mt-2">{message.content}</p>}
                </div>
              )}
              <p className="text-xs mt-1 opacity-70" aria-label={`Sent ${new Date(message.createdAt).toLocaleTimeString()}${message.isRead ? ', read' : ', unread'}`}>
                {new Date(message.createdAt).toLocaleTimeString()}
                {message.isRead && ' ✓'}
              </p>
            </article>

            {/* Message Reactions */}
            <MessageReactions
              messageId={message.id}
              reactions={message.reactions}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="p-4 border-t" style={{ backgroundColor: 'var(--bg-chat-header)', borderColor: 'var(--border-color)' }}>
          <FileUpload
            receiverId={chatId}
            onUploadSuccess={(message) => {
              setMessages(prev => [...prev, message])
              setShowFileUpload(false)
            }}
          />
          <button
            onClick={() => setShowFileUpload(false)}
            className="mt-2 text-sm hover:text-blue-400 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message Input */}
      <footer className="p-4" style={{ backgroundColor: 'var(--bg-chat-header)' }} role="contentinfo">
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={showFileUpload ? 'Hide file upload' : 'Show file upload'}
            aria-expanded={showFileUpload}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
        <form onSubmit={sendMessage} className="flex space-x-4" role="form" aria-label="Send message">
          <label htmlFor="message-input" className="sr-only">
            Type your message
          </label>
          <input
            id="message-input"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
            disabled={sending}
            aria-describedby="message-help"
            autoComplete="off"
          />
          <span id="message-help" className="sr-only">
            Press Enter to send your message, or use the send button
          </span>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-button)',
              color: 'var(--text-white)'
            }}
            aria-label={sending ? 'Sending message...' : 'Send message'}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </footer>

      {/* Active Call */}
      {activeCall && (
        <VideoCall
          callId={activeCall.id}
          caller={contact}
          receiver={user || undefined}
          isIncoming={isIncomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEnd={endCall}
        />
      )}
    </div>
  )
}

export default Chat
