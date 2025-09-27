// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  publicKey?: string;
  publicKeyFingerprint?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base types without id field for database operations
export interface UserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  avatar?: string;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // For direct messages
  groupId?: string; // For group messages
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: Date;
  reactions?: MessageReaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Message reaction types
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: ReactionType;
  createdAt: Date;
}

export type ReactionType = 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow' | 'thumbs_up' | 'thumbs_down';

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  members: string[];
  admins: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Call types
export interface Call {
  id: string;
  callerId: string;
  receiverId?: string;
  groupId?: string;
  type: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'missed' | 'declined';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  createdAt: Date;
}

// Contact types
export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebRTC types
export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
  callerId: string;
  receiverId?: string;
  groupId?: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  callerId: string;
}

export interface WebRTCIceCandidate {
  type: 'ice-candidate';
  candidate: any; // RTCIceCandidateInit in browser environment
  callerId: string;
}

// Socket event types
export interface ServerToClientEvents {
  'user:online': (user: User) => void;
  'user:offline': (userId: string) => void;
  'message:new': (message: Message) => void;
  'message:read': (messageId: string) => void;
  'message:reaction:added': (reaction: MessageReaction) => void;
  'message:reaction:removed': (messageId: string, userId: string, reaction: ReactionType) => void;
  'call:incoming': (call: Call) => void;
  'call:accepted': (callId: string) => void;
  'call:declined': (callId: string) => void;
  'call:ended': (callId: string) => void;
  'webrtc:offer': (offer: WebRTCOffer) => void;
  'webrtc:answer': (answer: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (candidate: WebRTCIceCandidate) => void;
  'group:created': (group: Group) => void;
  'group:updated': (group: Group) => void;
  'group:member:added': (groupId: string, userId: string) => void;
  'group:member:removed': (groupId: string, userId: string) => void;
}

export interface ClientToServerEvents {
  'user:connect': (userId: string) => void;
  'user:disconnect': () => void;
  'message:send': (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) => void;
  'message:mark-read': (messageId: string) => void;
  'message:add-reaction': (messageId: string, reaction: ReactionType) => void;
  'message:remove-reaction': (messageId: string, reaction: ReactionType) => void;
  'call:initiate': (call: Omit<Call, 'id' | 'createdAt'>) => void;
  'call:accept': (callId: string) => void;
  'call:decline': (callId: string) => void;
  'call:end': (callId: string) => void;
  'webrtc:offer': (offer: WebRTCOffer) => void;
  'webrtc:answer': (answer: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (candidate: WebRTCIceCandidate) => void;
  'group:create': (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => void;
  'group:join': (groupId: string) => void;
  'group:leave': (groupId: string) => void;
  'contact:add': (contactId: string) => void;
  'contact:accept': (contactId: string) => void;
  'contact:block': (contactId: string) => void;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'group_invite' | 'contact_request' | 'payment';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Encryption types
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  publicKey: string;
  signature: string;
}

export interface DecryptedMessage {
  content: string;
  verified: boolean;
}

export interface ChatKey {
  chatId: string;
  symmetricKey: string;
  participants: string[];
  createdAt: Date;
  lastUsed: Date;
}

export interface UserKeys {
  userId: string;
  keyPair: KeyPair;
  publicKeyFingerprint: string;
}

export interface EncryptedMessageData {
  id: string;
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  signature: string;
  timestamp: Date;
  encryptedKeys: { [userId: string]: string };
}

// Updated message interface to support encryption
export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // For direct messages
  groupId?: string; // For group messages
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: Date;
  reactions?: MessageReaction[];
  // Encryption fields
  isEncrypted?: boolean;
  encryptedData?: EncryptedMessageData;
  createdAt: Date;
  updatedAt: Date;
}
