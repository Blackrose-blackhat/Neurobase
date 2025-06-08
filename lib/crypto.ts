// lib/crypto.ts

import { SECRET_KEY } from "@/secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const IV_LENGTH = 12; // AES-GCM recommended nonce length

export async function generateKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SECRET_KEY), // fixed salt - must be same every time
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(secret: string, data: string): Promise<string> {
  const key = await generateKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(data);
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  // Use a URL-safe base64 encoding
  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function decryptData(secret: string, encryptedBase64: string): Promise<string> {
  const key = await generateKey(secret);
  // Convert URL-safe base64 back to standard base64
  const standardBase64 = encryptedBase64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/\s/g, '');
  // Add padding if needed
  const paddedBase64 = standardBase64 + '='.repeat((4 - standardBase64.length % 4) % 4);
  
  try {
    const combined = Uint8Array.from(atob(paddedBase64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
