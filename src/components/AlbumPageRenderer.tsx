// src/components/AlbumPageRenderer.tsx
import React from 'react';
import { AlbumPage, AlbumConfig } from '../types';
import './AlbumPageRenderer.css';

interface Props {
  page: AlbumPage;
  config: AlbumConfig;
  thumbnail?: boolean;
}

export default function AlbumPageRenderer({ page, config, thumbnail = false }: Props) {
  const isCover = page.pageNumber === 1;
  const isBack = page.pageNumber === config.pageCount;

  const accentColor = config.colorTheme || '#C9963A';
  const bg = page.backgroundColor || '#faf8f5';

  return (
    <div
      className={`album-page ${isCover ? 'cover' : ''} ${isBack ? 'back-cover' : ''} ${thumbnail ? 'thumbnail' : ''}`}
      style={{ backgroundColor: bg, '--accent': accentColor } as React.CSSProperties}
    >
      {/* ── Image slots ── */}
      <div className="page-images">
        {page.images.map((imgSlot, idx) => {
          const { position } = imgSlot;
          return (
            <div
              key={idx}
              className={`image-slot ${position.isFeatured ? 'featured' : ''}`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${position.width}%`,
                height: `${position.height}%`,
              }}
            >
              {imgSlot.url ? (
                <img
                  src={imgSlot.url}
                  alt={imgSlot.caption || `Photo ${idx + 1}`}
                  className="slot-img"
                  onError={e => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = 'none';
                    (t.parentElement as HTMLElement).classList.add('img-error');
                  }}
                />
              ) : (
                <div className="slot-placeholder">
                  <span>◈</span>
                </div>
              )}
              {/* Polaroid effect */}
              {config.layout === 'polaroid' && !thumbnail && (
                <div className="polaroid-frame" />
              )}
              {/* Individual image caption */}
              {imgSlot.caption && !thumbnail && config.includeCaption && (
                <div className="slot-caption">{imgSlot.caption}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Overlays for cover ── */}
      {isCover && (
        <div className="cover-overlay">
          <div className="cover-text-wrap">
            {config.eventDate && config.includeDateStamp && (
              <p className="cover-date">
                {new Date(config.eventDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            <h1 className="cover-title" style={{ color: 'white' }}>
              {config.coverTitle || config.eventTitle}
            </h1>
            {config.coverSubtitle && (
              <p className="cover-subtitle">{config.coverSubtitle}</p>
            )}
            <div className="cover-divider" style={{ background: accentColor }} />
          </div>
        </div>
      )}

      {/* ── Page caption ── */}
      {page.caption && !thumbnail && !isCover && config.includeCaption && (
        <div className="page-caption-bar">
          <span className="page-caption-ornament" style={{ color: accentColor }}>✦</span>
          <p className="page-caption-text">{page.caption}</p>
        </div>
      )}

      {/* ── Page number ── */}
      {!isCover && !thumbnail && (
        <div className="page-number">
          {page.pageNumber}
        </div>
      )}

      {/* ── Decorative corner ornament ── */}
      {!thumbnail && (
        <>
          <div className="corner-ornament top-left" style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament top-right" style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament bottom-left" style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament bottom-right" style={{ borderColor: `${accentColor}30` }} />
        </>
      )}

      {/* ── Scrapbook tape effect ── */}
      {config.layout === 'scrapbook' && !thumbnail && (
        <div className="scrapbook-tape" style={{ background: `${accentColor}40` }} />
      )}
    </div>
  );
}
