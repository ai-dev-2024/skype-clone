import {
  KeyPair,
  EncryptedMessage,
  DecryptedMessage,
  generateKeyPair,
  generateSymmetricKey,
  encryptMessage,
  decryptMessage,
  encryptSymmetricKey,
  decryptSymmetricKey,
  importPublicKey,
  importPrivateKey,
  hashData,
} from './crypto';

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
  encryptedKeys: { [userId: string]: string }; // Encrypted symmetric key for each participant
}

/**
 * End-to-end encryption service
 */
export class EncryptionService {
  private userKeys: UserKeys | null = null;
  private chatKeys: Map<string, ChatKey> = new Map();
  private keyCache: Map<string, string> = new Map(); // Cache for decrypted keys

  /**
   * Initialize user keys
   */
  async initializeUser(userId: string): Promise<UserKeys> {
    // Try to load existing keys from storage
    const storedKeys = await this.loadUserKeys(userId);

    if (storedKeys) {
      this.userKeys = storedKeys;
      return storedKeys;
    }

    // Generate new key pair
    const keyPair = await generateKeyPair();
    const publicKeyFingerprint = await hashData(keyPair.publicKey);

    this.userKeys = {
      userId,
      keyPair,
      publicKeyFingerprint,
    };

    // Store keys securely
    await this.saveUserKeys(this.userKeys);

    return this.userKeys;
  }

  /**
   * Get current user keys
   */
  getUserKeys(): UserKeys | null {
    return this.userKeys;
  }

  /**
   * Create or get chat encryption key
   */
  async getOrCreateChatKey(chatId: string, participants: string[]): Promise<ChatKey> {
    // Check if we already have a key for this chat
    const existingKey = this.chatKeys.get(chatId);
    if (existingKey) {
      existingKey.lastUsed = new Date();
      await this.saveChatKey(existingKey);
      return existingKey;
    }

    // Check storage for existing key
    const storedKey = await this.loadChatKey(chatId);
    if (storedKey) {
      this.chatKeys.set(chatId, storedKey);
      return storedKey;
    }

    // Generate new symmetric key for the chat
    const symmetricKey = await generateSymmetricKey();

    const chatKey: ChatKey = {
      chatId,
      symmetricKey,
      participants,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    this.chatKeys.set(chatId, chatKey);
    await this.saveChatKey(chatKey);

    return chatKey;
  }

  /**
   * Encrypt a message for all chat participants
   */
  async encryptMessageForChat(
    content: string,
    chatId: string,
    participants: Array<{ userId: string; publicKey: string }>
  ): Promise<EncryptedMessageData> {
    if (!this.userKeys) {
      throw new Error('User keys not initialized');
    }

    const chatKey = await this.getOrCreateChatKey(chatId, participants.map(p => p.userId));

    // Encrypt the message content
    const encryptedMessage = await encryptMessage(
      content,
      chatKey.symmetricKey,
      this.userKeys.keyPair.privateKey
    );

    // Encrypt the symmetric key for each participant
    const encryptedKeys: { [userId: string]: string } = {};
    for (const participant of participants) {
      encryptedKeys[participant.userId] = await encryptSymmetricKey(
        chatKey.symmetricKey,
        participant.publicKey
      );
    }

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: this.userKeys.userId,
      encryptedContent: encryptedMessage.encryptedContent,
      iv: encryptedMessage.iv,
      signature: encryptedMessage.signature,
      timestamp: new Date(),
      encryptedKeys,
    };
  }

  /**
   * Decrypt a message from another participant
   */
  async decryptMessage(encryptedMessageData: EncryptedMessageData): Promise<DecryptedMessage> {
    if (!this.userKeys) {
      throw new Error('User keys not initialized');
    }

    // Get the encrypted symmetric key for this user
    const encryptedKeyForUser = encryptedMessageData.encryptedKeys[this.userKeys.userId];
    if (!encryptedKeyForUser) {
      throw new Error('No encrypted key found for this user');
    }

    // Decrypt the symmetric key
    let symmetricKey: string;
    const cacheKey = `${encryptedMessageData.chatId}_${this.userKeys.userId}`;

    if (this.keyCache.has(cacheKey)) {
      symmetricKey = this.keyCache.get(cacheKey)!;
    } else {
      symmetricKey = await decryptSymmetricKey(
        encryptedKeyForUser,
        this.userKeys.keyPair.privateKey
      );
      this.keyCache.set(cacheKey, symmetricKey);
    }

    // Get sender's public key (this should be cached or fetched)
    const senderPublicKey = await this.getParticipantPublicKey(encryptedMessageData.senderId);

    // Decrypt the message
    const encryptedMessage: EncryptedMessage = {
      encryptedContent: encryptedMessageData.encryptedContent,
      iv: encryptedMessageData.iv,
      publicKey: senderPublicKey,
      signature: encryptedMessageData.signature,
    };

    return await decryptMessage(encryptedMessage, symmetricKey, senderPublicKey);
  }

  /**
   * Add participant to existing chat
   */
  async addParticipantToChat(
    chatId: string,
    newParticipant: { userId: string; publicKey: string }
  ): Promise<void> {
    const chatKey = this.chatKeys.get(chatId) || await this.loadChatKey(chatId);
    if (!chatKey) {
      throw new Error('Chat key not found');
    }

    // Add participant to the list
    if (!chatKey.participants.includes(newParticipant.userId)) {
      chatKey.participants.push(newParticipant.userId);
      chatKey.lastUsed = new Date();
      await this.saveChatKey(chatKey);
    }
  }

  /**
   * Remove participant from chat (re-key required for security)
   */
  async removeParticipantFromChat(chatId: string, participantId: string): Promise<ChatKey> {
    const chatKey = this.chatKeys.get(chatId) || await this.loadChatKey(chatId);
    if (!chatKey) {
      throw new Error('Chat key not found');
    }

    // Remove participant
    chatKey.participants = chatKey.participants.filter(id => id !== participantId);

    // Generate new key for remaining participants
    const newSymmetricKey = await generateSymmetricKey();
    const newChatKey: ChatKey = {
      ...chatKey,
      symmetricKey: newSymmetricKey,
      lastUsed: new Date(),
    };

    this.chatKeys.set(chatId, newChatKey);
    await this.saveChatKey(newChatKey);

    // Clear key cache for this chat
    const cacheKey = `${chatId}_${participantId}`;
    this.keyCache.delete(cacheKey);

    return newChatKey;
  }

  /**
   * Get participant public key (should be implemented to fetch from server/storage)
   */
  private async getParticipantPublicKey(userId: string): Promise<string> {
    // This should fetch the public key from server or local storage
    // For now, throw an error to indicate this needs implementation
    throw new Error('getParticipantPublicKey must be implemented by the application');
  }

  /**
   * Load user keys from secure storage
   */
  private async loadUserKeys(userId: string): Promise<UserKeys | null> {
    // Implementation depends on platform (React Native, Electron, Web)
    // This should use secure storage mechanisms
    return null;
  }

  /**
   * Save user keys to secure storage
   */
  private async saveUserKeys(userKeys: UserKeys): Promise<void> {
    // Implementation depends on platform (React Native, Electron, Web)
    // This should use secure storage mechanisms
  }

  /**
   * Load chat key from storage
   */
  private async loadChatKey(chatId: string): Promise<ChatKey | null> {
    // Implementation depends on platform
    return null;
  }

  /**
   * Save chat key to storage
   */
  private async saveChatKey(chatKey: ChatKey): Promise<void> {
    // Implementation depends on platform
  }

  /**
   * Clear all cached keys for a chat
   */
  clearChatCache(chatId: string): void {
    for (const [key, value] of this.keyCache.entries()) {
      if (key.startsWith(`${chatId}_`)) {
        this.keyCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.keyCache.clear();
    this.chatKeys.clear();
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
