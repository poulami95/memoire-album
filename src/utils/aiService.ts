// src/utils/aiService.ts
import { UploadedImage, AlbumConfig, AlbumPage, AlbumPageImage, PageLayout, LayoutSlot } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(messages: any[], systemPrompt?: string, maxTokens = 1000) {
  const body: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('REACT_APP_ANTHROPIC_API_KEY is not set');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/** Convert a file/url to base64 for sending to Claude Vision */
async function imageToBase64(image: UploadedImage): Promise<{ base64: string; mediaType: string } | null> {
  try {
    if (image.file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const [header, base64] = result.split(',');
          const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
          resolve({ base64, mediaType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(image.file!);
      });
    }
    // For URL-based images (Google Drive or external links)
    // We'll use the URL directly (Claude can handle image URLs via base64)
    return null;
  } catch {
    return null;
  }
}

/** Score and caption images using Claude Vision */
export async function analyzeImages(
  images: UploadedImage[],
  config: AlbumConfig,
  onProgress: (i: number, total: number) => void
): Promise<UploadedImage[]> {
  const results: UploadedImage[] = [];

  for (let i = 0; i < images.length; i++) {
    onProgress(i, images.length);
    const image = images[i];
    try {
      const b64 = await imageToBase64(image);

      let contentBlocks: any[] = [];
      if (b64) {
        contentBlocks = [
          {
            type: 'image',
            source: { type: 'base64', media_type: b64.mediaType, data: b64.base64 },
          },
          {
            type: 'text',
            text: `Analyze this photo for a ${config.occasion} album titled "${config.eventTitle}".
Event description: "${config.eventDescription}"

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": <number 0-100, quality + relevance>,
  "caption": "<short poetic caption under 15 words>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`,
          },
        ];
      } else {
        // Fallback: text-only analysis using filename
        contentBlocks = [
          {
            type: 'text',
            text: `For a ${config.occasion} photo album, generate metadata for an image named "${image.name}".
Return ONLY valid JSON:
{"score": 75, "caption": "A beautiful moment captured", "tags": ["memory", "${config.occasion}", "photo"]}`,
          },
        ];
      }

      const text = await callClaude([{ role: 'user', content: contentBlocks }]);
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      results.push({
        ...image,
        selected: parsed.score >= 50,
        aiScore: parsed.score,
        aiCaption: parsed.caption,
        tags: parsed.tags,
      });
    } catch {
      results.push({ ...image, selected: true, aiScore: 70, aiCaption: 'A cherished memory', tags: [config.occasion] });
    }
  }

  onProgress(images.length, images.length);
  return results;
}

/** Generate album page layout plan using Claude */
export async function generateAlbumPlan(
  images: UploadedImage[],
  config: AlbumConfig
): Promise<AlbumPage[]> {
  const selectedImages = images.filter(img => img.selected);
  const imageList = selectedImages.map((img, idx) => ({
    index: idx,
    id: img.id,
    name: img.name,
    score: img.aiScore || 70,
    caption: img.aiCaption || '',
    tags: img.tags || [],
  }));

  const prompt = `You are a professional photo album designer.
Create a ${config.pageCount}-page album for a ${config.occasion} event.
Event: "${config.eventTitle}"
Description: "${config.eventDescription}"
Layout style: ${config.layout}
Available images (${selectedImages.length} total):
${JSON.stringify(imageList, null, 2)}

Design rules:
- Page 1 = Cover (1 hero image, full bleed)
- Pages 2-${config.pageCount - 1} = Content pages (mix 1-4 images per page)
- Last page = Back cover or finale
- Spread the highest-scored images across key pages
- Group thematically similar images together

Return ONLY valid JSON array, no markdown:
[
  {
    "pageNumber": 1,
    "layout": "full-bleed",
    "caption": "<page caption>",
    "imageIndices": [<index from imageList>],
    "backgroundColor": "#f5f0eb"
  }
]`;

  const text = await callClaude(
    [{ role: 'user', content: prompt }],
    'You are a professional photo album designer. Always respond with valid JSON only.',
    2000
  );
  const cleaned = text.replace(/```json|```/g, '').trim();
  const plan: any[] = JSON.parse(cleaned);

  return plan.map((p, i) => {
    const layout = getLayout(p.layout, p.imageIndices?.length || 1);
    const pageImages: AlbumPageImage[] = (p.imageIndices || [])
      .slice(0, layout.slots.length)
      .map((imgIdx: number, slotIdx: number) => {
        const img = selectedImages[imgIdx] || selectedImages[0];
        return {
          imageId: img?.id || '',
          url: img?.url || '',
          position: layout.slots[slotIdx],
          caption: img?.aiCaption,
        };
      });

    return {
      id: `page_${i}`,
      pageNumber: p.pageNumber || i + 1,
      layout,
      images: pageImages,
      caption: p.caption,
      backgroundColor: p.backgroundColor || '#faf8f5',
    };
  });
}

/** Generate a narrative caption for a page */
export async function generatePageCaption(
  images: UploadedImage[],
  pageNumber: number,
  occasion: string,
  eventTitle: string
): Promise<string> {
  const captions = images.map(img => img.aiCaption).filter(Boolean).join(', ');
  const text = await callClaude([
    {
      role: 'user',
      content: `Write a short, poetic caption (under 12 words) for page ${pageNumber} of a ${occasion} album called "${eventTitle}". Photo descriptions: ${captions}. Return only the caption text.`,
    },
  ]);
  return text.trim().replace(/^["']|["']$/g, '');
}

// ─── Layout helpers ────────────────────────────────────────────────────────

const SLOT_PCTS = {
  'full-bleed': [{ x: 0, y: 0, width: 100, height: 100 }],
  'two-equal': [
    { x: 0, y: 0, width: 50, height: 100 },
    { x: 50, y: 0, width: 50, height: 100 },
  ],
  'three-row': [
    { x: 0, y: 0, width: 100, height: 33 },
    { x: 0, y: 33, width: 100, height: 34 },
    { x: 0, y: 67, width: 100, height: 33 },
  ],
  'hero-two': [
    { x: 0, y: 0, width: 60, height: 100, isFeatured: true },
    { x: 60, y: 0, width: 40, height: 50 },
    { x: 60, y: 50, width: 40, height: 50 },
  ],
  'four-grid': [
    { x: 0, y: 0, width: 50, height: 50 },
    { x: 50, y: 0, width: 50, height: 50 },
    { x: 0, y: 50, width: 50, height: 50 },
    { x: 50, y: 50, width: 50, height: 50 },
  ],
} as Record<string, Array<{ x: number; y: number; width: number; height: number; isFeatured?: boolean }>>;

function getLayout(name: string, imageCount: number): PageLayout {
  let slotKey = name;
  if (!SLOT_PCTS[slotKey]) {
    if (imageCount === 1) slotKey = 'full-bleed';
    else if (imageCount === 2) slotKey = 'two-equal';
    else if (imageCount === 3) slotKey = 'hero-two';
    else slotKey = 'four-grid';
  }
  const slots = SLOT_PCTS[slotKey] || SLOT_PCTS['full-bleed'];
  return { id: slotKey, name: slotKey, slots, imageCount: slots.length };
}
