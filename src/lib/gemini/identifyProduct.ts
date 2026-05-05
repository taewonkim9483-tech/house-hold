import { GoogleGenAI } from '@google/genai';
import { IdentifiedProduct } from '@/types/domain';

const MODELS = ['gemini-2.0-flash-001', 'gemini-2.5-flash', 'gemini-flash-latest'];

const PROMPT = `Identify the product in this image.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "name": "string (Japanese product name, brand included)",
  "brand": "string",
  "volume_ml": number | null,
  "weight_g": number | null,
  "unit_type": "per_100g|per_100ml|per_count",
  "tags": ["string (Japanese, 2-4 tags)"]
}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function identifyProduct(imageBase64: string, mimeType: string): Promise<IdentifiedProduct> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: PROMPT },
          ],
          config: {
            systemInstruction: 'You are a product identifier. Respond in valid JSON only.',
            temperature: 0.1,
          },
        });

        const text = response.text ?? '';
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        return JSON.parse(cleaned) as IdentifiedProduct;
      } catch (e) {
        lastError = e;
        const status = (e as { status?: number })?.status;
        if (status === 503 && attempt === 0) {
          await sleep(2000);
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}
