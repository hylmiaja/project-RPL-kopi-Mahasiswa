import { POST as chatbotPost } from '../ai/chatbot/route';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Endpoint alternatif /api/chat yang mendelegasikan ke chatbot route utama.
 * Memastikan kompatibilitas jika dipanggil via /api/chat.
 */
export async function POST(req: Request) {
  return chatbotPost(req);
}

