// src/utils/exportService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AlbumPage, AlbumConfig } from '../types';

export async function exportAlbumToPDF(
  config: AlbumConfig,
  pages: AlbumPage[],
  onProgress?: (p: number) => void
): Promise<Blob> {
  const isLandscape = config.size === 'landscape';
  const isPortrait = config.size === 'portrait';

  // Page dimensions in mm
  const width = isLandscape ? 297 : isPortrait ? 148 : 210;
  const height = isLandscape ? 210 : isPortrait ? 210 : 210;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isLandscape ? 'a4' : isPortrait ? [148, 210] : 'a4',
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    if (onProgress) onProgress(Math.round((i / pages.length) * 90));

    const pageEl = document.getElementById(`album-page-${pages[i].id}`);
    if (pageEl) {
      try {
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: pages[i].backgroundColor || '#faf8f5',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      } catch (e) {
        // fallback: draw background rect
        pdf.setFillColor(pages[i].backgroundColor || '#faf8f5');
        pdf.rect(0, 0, width, height, 'F');
        pdf.setFontSize(12);
        pdf.text(`Page ${pages[i].pageNumber}`, width / 2, height / 2, { align: 'center' });
      }
    } else {
      pdf.setFillColor('#f5f0eb');
      pdf.rect(0, 0, width, height, 'F');
      pdf.setFontSize(14);
      pdf.text(`Page ${pages[i].pageNumber}`, width / 2, height / 2, { align: 'center' });
    }
  }

  if (onProgress) onProgress(100);
  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Printing vendors with integration info */
export const printingVendors = [
  {
    id: 'printmylook',
    name: 'PrintMyLook',
    website: 'https://www.printmylook.com',
    apiAvailable: false,
    shipsToIndia: true,
    priceRange: '₹599 – ₹2,499',
    turnaround: '3–5 business days',
    description: 'India-based premium photo book printing, ships PAN India.',
    logoColor: '#E84393',
  },
  {
    id: 'zoomin',
    name: 'Zoomin',
    website: 'https://www.zoomin.com',
    apiAvailable: false,
    shipsToIndia: true,
    priceRange: '₹799 – ₹3,999',
    turnaround: '4–7 business days',
    description: 'Popular Indian photo products platform, wide format & size options.',
    logoColor: '#FF6B35',
  },
  {
    id: 'photojaanic',
    name: 'Photojaanic',
    website: 'https://www.photojaanic.com',
    apiAvailable: false,
    shipsToIndia: true,
    priceRange: '₹1,200 – ₹5,500',
    turnaround: '5–8 business days',
    description: 'Professional quality photo books, layflat options available.',
    logoColor: '#2D6A4F',
  },
  {
    id: 'printingforless',
    name: 'Printing For Less',
    website: 'https://www.printingforless.com',
    apiAvailable: false,
    shipsToIndia: false,
    priceRange: '$19 – $89',
    turnaround: '5–7 business days',
    description: 'US-based high quality offset printing for professional albums.',
    logoColor: '#1A56DB',
  },
  {
    id: 'blurb',
    name: 'Blurb',
    website: 'https://www.blurb.com',
    apiAvailable: true,
    shipsToIndia: true,
    priceRange: '$14 – $120',
    turnaround: '7–14 business days',
    description: 'Global photo book platform with API access, ships worldwide.',
    logoColor: '#FF3B6F',
  },
  {
    id: 'loxley',
    name: 'Loxley Colour',
    website: 'https://www.loxleycolour.com',
    apiAvailable: false,
    shipsToIndia: false,
    priceRange: '£12 – £85',
    turnaround: '3–5 business days',
    description: 'UK professional lab quality, used by photographers worldwide.',
    logoColor: '#6C3483',
  },
];
