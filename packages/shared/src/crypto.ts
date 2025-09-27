import { webcrypto } from 'crypto';

// Use Web Crypto API for both Node.js and browser environments
const crypto = webcrypto;

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

/**
 * Generate RSA key pair for asymmetric encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
  };
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const publicKeyDer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'spki',
    publicKeyDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

/**
 * Import private key from base64 string
 */
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const privateKeyDer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );
}

/**
 * Generate symmetric key for message encryption
 */
export async function generateSymmetricKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
}

/**
 * Import symmetric key from base64 string
 */
export async function importSymmetricKey(keyBase64: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt message content with symmetric key
 */
export async function encryptMessage(
  content: string,
  symmetricKey: string,
  senderPrivateKey: string
): Promise<EncryptedMessage> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import symmetric key
  const key = await importSymmetricKey(symmetricKey);

  // Encrypt content
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

  // Sign the encrypted content
  const signature = await signMessage(encryptedContent, senderPrivateKey);

  return {
    encryptedContent,
    iv: btoa(String.fromCharCode(...iv)),
    publicKey: '', // Will be set by caller
    signature,
  };
}

/**
 * Decrypt message content with symmetric key
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  symmetricKey: string,
  senderPublicKey: string
): Promise<DecryptedMessage> {
  try {
    // Verify signature
    const verified = await verifySignature(
      encryptedMessage.encryptedContent,
      encryptedMessage.signature,
      senderPublicKey
    );

    if (!verified) {
      throw new Error('Message signature verification failed');
    }

    // Import symmetric key
    const key = await importSymmetricKey(symmetricKey);

    // Decrypt content
    const encryptedData = Uint8Array.from(atob(encryptedMessage.encryptedContent), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedMessage.iv), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const content = decoder.decode(decrypted);

    return {
      content,
      verified: true,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    return {
      content: '[Encrypted message - decryption failed]',
      verified: false,
    };
  }
}

/**
 * Encrypt symmetric key with recipient's public key
 */
export async function encryptSymmetricKey(
  symmetricKey: string,
  recipientPublicKey: string
): Promise<string> {
  const publicKey = await importPublicKey(recipientPublicKey);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(symmetricKey);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    keyData
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Decrypt symmetric key with recipient's private key
 */
export async function decryptSymmetricKey(
  encryptedKey: string,
  recipientPrivateKey: string
): Promise<string> {
  const privateKey = await importPrivateKey(recipientPrivateKey);
  const encryptedData = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Sign message with private key
 */
export async function signMessage(message: string, privateKey: string): Promise<string> {
  const key = await importPrivateKey(privateKey);
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signature = await crypto.subtle.sign(
    {
      name: 'RSA-PSS',
      saltLength: 32,
    },
    key,
    data
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify message signature with public key
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const key = await importPublicKey(publicKey);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const signatureData = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      key,
      signatureData,
      data
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).substring(0, length);
}

/**
 * Hash data for integrity checks
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}
