import { GoogleGenAI } from '@google/genai';
import { AnalyzedReceipt } from '@/types/domain';

// 우선순위 순서로 시도할 모델 목록
const MODELS = ['gemini-2.0-flash-001', 'gemini-2.5-flash', 'gemini-flash-latest'];

const PROMPT = `Analyze this Japanese receipt image and extract all information.
Also classify each item and assign tags for price comparison.

Respond ONLY with this JSON structure:
{
  "store_name": "string (Japanese)",
  "purchased_at": "ISO8601 datetime",
  "total_amount": number,
  "tax_amount": number | null,
  "items": [
    {
      "name": "string (Japanese original)",
      "quantity": number,
      "unit_price": number,
      "subtotal": number,
      "category": "生鮮食品|加工食品|飲料|アルコール|日用品|清掃用品|医薬品・健康|ペット用品|育児用品|その他",
      "tags": ["string"],
      "unit_type": "per_100g|per_100ml|per_count",
      "weight_g": number | null,
      "volume_ml": number | null,
      "price_per_100": number | null
    }
  ]
}

Rules:
- unit_type: use per_100g for meat/fish, per_100ml for beverages, per_count otherwise
- price_per_100: calculate if weight_g or volume_ml is available
- tags: use Japanese, 2-4 tags per item (product type, brand hint, size hint)
- All amounts in JPY integers`;

const CATEGORY_MAP: Record<string, string> = {
  '生鮮食品': '신선식품',
  '加工食品': '가공식품',
  '飲料': '음료',
  'アルコール': '주류',
  '日用品': '생활용품',
  '清掃用品': '청소용품',
  '医薬品・健康': '의약품/건강',
  'ペット用品': '반려동물용품',
  '育児用品': '육아용품',
  'その他': '기타',
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeReceiptImage(imageBase64: string, mimeType: string): Promise<AnalyzedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });

  let lastError: unknown;

  for (const model of MODELS) {
    // 각 모델에 대해 최대 2회 재시도 (503 대응)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: PROMPT },
          ],
          config: {
            systemInstruction: 'You are a receipt analyzer. Always respond in valid JSON only. No markdown, no explanation.',
            temperature: 0.1,
          },
        });

        const text = response.text ?? '';
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          storeName: parsed.store_name,
          purchasedAt: parsed.purchased_at,
          totalAmount: parsed.total_amount,
          taxAmount: parsed.tax_amount ?? null,
          items: parsed.items.map((item: Record<string, unknown>) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal,
            category: CATEGORY_MAP[item.category as string] ?? '기타',
            tags: item.tags ?? [],
            unitType: item.unit_type ?? 'per_count',
            weightG: item.weight_g ?? null,
            volumeMl: item.volume_ml ?? null,
            pricePer100: item.price_per_100 ?? null,
          })),
        };
      } catch (e) {
        lastError = e;
        const status = (e as { status?: number })?.status;
        // 503이면 잠시 대기 후 재시도, 그 외 에러는 다음 모델로
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
