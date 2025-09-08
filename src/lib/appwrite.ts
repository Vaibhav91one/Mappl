import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

export const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export async function ping() {
  // Minimal request to validate connectivity: list server locale codes
  // If this succeeds, endpoint+project are valid and network works
  return client.ping();
}

// Server-side client for API routes (uses API key)
// For server-only (API routes), use node-appwrite instead


