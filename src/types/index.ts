// src/types/index.ts

export type OccasionType =
  | 'wedding'
  | 'birthday'
  | 'graduation'
  | 'anniversary'
  | 'travel'
  | 'family'
  | 'corporate'
  | 'baby_shower'
  | 'holiday'
  | 'other';

export type AlbumLayout =
  | 'classic'
  | 'modern'
  | 'editorial'
  | 'polaroid'
  | 'cinematic'
  | 'scrapbook';

export type AlbumSize = 'square' | 'landscape' | 'portrait';
export type AlbumCoverStyle = 'hardcover' | 'softcover' | 'layflat';
export type PaperFinish = 'glossy' | 'matte' | 'lustre';

export interface UploadedImage {
  id: string;
  file?: File;
  url: string;
  name: string;
  size?: number;
  source: 'upload' | 'google_drive' | 'url';
  selected: boolean;
  aiScore?: number;        // 0-100 quality/relevance score from AI
  aiCaption?: string;      // AI-generated caption
  tags?: string[];         // AI-detected tags
  thumbnail?: string;
}

export interface AlbumPage {
  id: string;
  pageNumber: number;
  layout: PageLayout;
  images: AlbumPageImage[];
  caption?: string;
  backgroundColor?: string;
  theme?: string;
}

export interface AlbumPageImage {
  imageId: string;
  url: string;
  position: LayoutSlot;
  caption?: string;
  filter?: string;
}

export interface PageLayout {
  id: string;
  name: string;
  slots: LayoutSlot[];
  imageCount: number;
}

export interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  isFeatured?: boolean;
}

export interface AlbumConfig {
  occasion: OccasionType;
  eventTitle: string;
  eventDescription: string;
  eventDate?: string;
  pageCount: number;
  layout: AlbumLayout;
  size: AlbumSize;
  coverStyle: AlbumCoverStyle;
  paperFinish: PaperFinish;
  colorTheme: string;
  includeCaption: boolean;
  includeDateStamp: boolean;
  coverImage?: string;
  coverTitle: string;
  coverSubtitle?: string;
}

export type WorkflowStep =
  | 'upload'
  | 'configure'
  | 'processing'
  | 'preview'
  | 'export';

export interface PrintingVendor {
  id: string;
  name: string;
  website: string;
  apiAvailable: boolean;
  shipsToIndia: boolean;
  priceRange: string;
  turnaround: string;
  description: string;
  logoColor: string;
}

export interface AlbumProject {
  id: string;
  config: AlbumConfig;
  images: UploadedImage[];
  pages: AlbumPage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'processing' | 'complete';
}
