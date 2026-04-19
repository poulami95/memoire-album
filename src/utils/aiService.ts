// src/utils/aiService.ts
import { UploadedImage, AlbumConfig, AlbumPage, AlbumPageImage, PageLayout, NarrativeContent } from '../types';

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

      const styleContext = config.stylePrompt
        ? `Style direction: "${config.stylePrompt}"`
        : '';

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
${styleContext}

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": <number 0-100, quality + relevance>,
  "caption": "<short poetic caption under 15 words, matching the style direction>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`,
          },
        ];
      } else {
        // Fallback: text-only analysis using filename
        contentBlocks = [
          {
            type: 'text',
            text: `For a ${config.occasion} photo album${config.stylePrompt ? ` with style "${config.stylePrompt}"` : ''}, generate metadata for an image named "${image.name}".
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

  const styleDirective = config.stylePrompt
    ? `\nCreative vision: "${config.stylePrompt}"\nUse this to inform background colours, mood of captions, and layout choices.`
    : '';

  // narrative pages: roughly 1 per 4 content pages, placed after grouped photo runs
  const totalPages = config.pageCount;
  const contentPages = totalPages - 2; // exclude cover + back
  const narrativeCount = Math.max(1, Math.floor(contentPages / 4));

  const prompt = `You are a professional photo album designer.
Create EXACTLY ${totalPages} pages for a ${config.occasion} album.
Event: "${config.eventTitle}"${styleDirective}
Layout style: ${config.layout}
Available images (${selectedImages.length} total, indices 0–${selectedImages.length - 1}):
${JSON.stringify(imageList, null, 2)}

STRICT rules — you MUST return exactly ${totalPages} page objects:
- Page 1: layout="full-bleed", type="cover", 1 highest-scored hero image
- Pages 2–${totalPages - 1}: content pages. Include ~${narrativeCount} "narrative" page(s) (type="narrative", no images) spread across the album as section openers. The rest are photo pages (type="photo") with 1–4 images each. Reuse image indices to fill all photo pages if needed — never leave a photo page with 0 images.
- Page ${totalPages}: layout="full-bleed", type="back-cover", 1 image or 0 images (solid colour finale)
- Spread the highest-scored images across key spreads
- Choose background colours matching the creative vision
- Write captions/narrative text matching the mood

Return ONLY a valid JSON array of exactly ${totalPages} objects, no markdown:
[
  {
    "pageNumber": 1,
    "type": "cover",
    "layout": "full-bleed",
    "caption": "<cover caption>",
    "imageIndices": [0],
    "backgroundColor": "#ffffff"
  },
  {
    "pageNumber": 2,
    "type": "narrative",
    "layout": "narrative",
    "caption": "",
    "imageIndices": [],
    "backgroundColor": "#f9f7f4",
    "narrativeHeading": "<large section heading, 2–5 words>",
    "narrativeSubheading": "<elegant short subtitle, script style>",
    "narrativeBody": "<2–3 sentence poetic paragraph about what follows>"
  },
  {
    "pageNumber": 3,
    "type": "photo",
    "layout": "two-equal",
    "caption": "<page caption>",
    "imageIndices": [1, 2],
    "backgroundColor": "#faf8f5"
  }
]`;

  const text = await callClaude(
    [{ role: 'user', content: prompt }],
    'You are a professional photo album designer. Always respond with valid JSON only.',
    4000
  );
  const cleaned = text.replace(/```json|```/g, '').trim();
  let plan: any[] = JSON.parse(cleaned);

  // Enforce exact page count — pad or trim
  if (plan.length < totalPages) {
    // Fill missing pages by cycling images
    const lastPhoto = plan.filter(p => p.type === 'photo').pop();
    while (plan.length < totalPages) {
      const idx = plan.length;
      plan.splice(plan.length - 1, 0, {
        pageNumber: idx,
        type: 'photo',
        layout: 'two-equal',
        caption: '',
        imageIndices: lastPhoto?.imageIndices || [0],
        backgroundColor: '#faf8f5',
      });
    }
    // Re-number
    plan = plan.map((p, i) => ({ ...p, pageNumber: i + 1 }));
  } else if (plan.length > totalPages) {
    // Keep cover, last page, and trim middle
    const cover = plan[0];
    const back = plan[plan.length - 1];
    const middle = plan.slice(1, plan.length - 1).slice(0, totalPages - 2);
    plan = [cover, ...middle, back].map((p, i) => ({ ...p, pageNumber: i + 1 }));
  }

  return plan.map((p, i) => {
    const isNarrative = p.type === 'narrative' || p.layout === 'narrative';

    const narrativeContent: NarrativeContent | undefined = isNarrative ? {
      heading: p.narrativeHeading || 'A moment to remember',
      subheading: p.narrativeSubheading,
      body: p.narrativeBody,
    } : undefined;

    const layout = isNarrative
      ? getLayout('full-bleed', 0)
      : getLayout(p.layout, p.imageIndices?.length || 1);

    const pageImages: AlbumPageImage[] = isNarrative
      ? []
      : (p.imageIndices || [])
          .slice(0, layout.slots.length)
          .map((imgIdx: number, slotIdx: number) => {
            const img = selectedImages[imgIdx % selectedImages.length] || selectedImages[0];
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
      caption: isNarrative ? '' : p.caption,
      backgroundColor: p.backgroundColor || '#faf8f5',
      textContent: narrativeContent,
    } as AlbumPage;
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

/** Score and auto-select best images using Claude Vision (no album context needed) */
export async function smartSelectImages(
  images: UploadedImage[],
  onProgress: (i: number, total: number) => void
): Promise<UploadedImage[]> {
  const results: UploadedImage[] = [];

  for (let i = 0; i < images.length; i++) {
    onProgress(i, images.length);
    const image = images[i];
    try {
      const b64 = await imageToBase64(image);
      if (!b64) {
        results.push({ ...image, aiScore: 72 });
        continue;
      }
      const text = await callClaude([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: b64.mediaType, data: b64.base64 } },
          {
            type: 'text',
            text: `Evaluate this photo's quality for a printed photo album. Consider sharpness, exposure, composition, and emotional impact.
Return ONLY valid JSON (no markdown):
{"score": <number 0-100>, "reason": "<5-8 word reason>"}`,
          },
        ],
      }]);
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      results.push({ ...image, aiScore: parsed.score, aiCaption: parsed.reason });
    } catch {
      results.push({ ...image, aiScore: 65 });
    }
  }

  onProgress(images.length, images.length);

  // Auto-select: mark top images as selected (score >= 60, but always at least top 3)
  const sorted = [...results].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  const threshold = Math.max(60, sorted[Math.min(2, sorted.length - 1)]?.aiScore || 60);
  return results.map(img => ({
    ...img,
    selected: (img.aiScore || 0) >= threshold,
  }));
}

// ─── Layout helpers ────────────────────────────────────────────────────────

export const LAYOUT_OPTIONS = [
  { id: 'full-bleed', name: 'Full Page', imageCount: 1 },
  { id: 'two-equal', name: 'Side by Side', imageCount: 2 },
  { id: 'hero-two', name: 'Feature + 2', imageCount: 3 },
  { id: 'three-row', name: 'Three Rows', imageCount: 3 },
  { id: 'four-grid', name: 'Four Grid', imageCount: 4 },
] as const;

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

export function getLayout(name: string, imageCount: number): PageLayout {
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
