// src/components/AlbumPageRenderer.tsx
import React from 'react';
import { AlbumPage, AlbumConfig, PageBorderStyle } from '../types';
import './AlbumPageRenderer.css';

interface Props {
  page: AlbumPage;
  config: AlbumConfig;
  thumbnail?: boolean;
  onReplaceSlot?: (slotIndex: number) => void;
}

export default function AlbumPageRenderer({ page, config, thumbnail = false, onReplaceSlot }: Props) {
  const isCover = page.pageNumber === 1;
  const isBack = page.pageNumber === config.pageCount;
  const isNarrative = !!(page.textContent && page.images.length === 0 && !isCover);

  const accentColor = config.colorTheme || '#C9963A';
  const bg = page.backgroundColor || '#faf8f5';
  const borderStyle: PageBorderStyle = page.pageStyle || 'none';

  return (
    <div
      className={[
        'album-page',
        isCover ? 'cover' : '',
        isBack ? 'back-cover' : '',
        isNarrative ? 'narrative-page' : '',
        thumbnail ? 'thumbnail' : '',
        `border-style--${borderStyle}`,
      ].filter(Boolean).join(' ')}
      style={{ backgroundColor: bg, '--accent': accentColor } as React.CSSProperties}
    >
      {/* ── Border/mat overlays ── */}
      {!thumbnail && borderStyle !== 'none' && <BorderOverlay style={borderStyle} accent={accentColor} />}

      {/* ── Narrative / text-only page ── */}
      {isNarrative && page.textContent && !thumbnail && (
        <div className="narrative-content">
          <div className="narrative-accent-line" style={{ background: accentColor }} />
          <h2 className="narrative-heading">{page.textContent.heading}</h2>
          {page.textContent.subheading && (
            <p className="narrative-subheading">{page.textContent.subheading}</p>
          )}
          {page.textContent.body && (
            <p className="narrative-body">{page.textContent.body}</p>
          )}
          <div className="narrative-ornament" style={{ color: accentColor }}>✦</div>
        </div>
      )}

      {/* Thumbnail stub for narrative pages */}
      {isNarrative && thumbnail && (
        <div className="narrative-thumb-stub" style={{ color: accentColor }}>
          <span style={{ fontSize: 8 }}>✦</span>
        </div>
      )}

      {/* ── Image slots ── */}
      {!isNarrative && (
        <div className="page-images">
          {page.images.map((imgSlot, idx) => {
            const { position } = imgSlot;
            return (
              <div
                key={idx}
                className={`image-slot ${position.isFeatured ? 'featured' : ''} ${!thumbnail && onReplaceSlot ? 'replaceable' : ''}`}
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
                  <div className="slot-placeholder"><span>◈</span></div>
                )}
                {/* Replace photo overlay */}
                {!thumbnail && onReplaceSlot && (
                  <button
                    className="slot-replace-btn"
                    onClick={e => { e.stopPropagation(); onReplaceSlot(idx); }}
                    title="Replace photo"
                  >
                    <span className="slot-replace-icon-inner">⬆</span>
                    <span className="slot-replace-label-inner">Replace</span>
                  </button>
                )}
                {config.layout === 'polaroid' && !thumbnail && (
                  <div className="polaroid-frame" />
                )}
                {imgSlot.caption && !thumbnail && config.includeCaption && (
                  <div className="slot-caption">{imgSlot.caption}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cover overlay ── */}
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

      {/* ── Page caption bar ── */}
      {page.caption && !thumbnail && !isCover && !isNarrative && config.includeCaption && (
        <div className="page-caption-bar">
          <span className="page-caption-ornament" style={{ color: accentColor }}>✦</span>
          <p className="page-caption-text">{page.caption}</p>
        </div>
      )}

      {/* ── Page number ── */}
      {!isCover && !thumbnail && (
        <div className="page-number">{page.pageNumber}</div>
      )}

      {/* ── Decorative corner ornaments ── */}
      {!thumbnail && borderStyle === 'none' && (
        <>
          <div className="corner-ornament top-left"    style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament top-right"   style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament bottom-left" style={{ borderColor: `${accentColor}30` }} />
          <div className="corner-ornament bottom-right"style={{ borderColor: `${accentColor}30` }} />
        </>
      )}

      {/* ── Scrapbook tape ── */}
      {config.layout === 'scrapbook' && !thumbnail && (
        <div className="scrapbook-tape" style={{ background: `${accentColor}40` }} />
      )}
    </div>
  );
}

/* ── Border/mat overlay components ── */
function BorderOverlay({ style, accent }: { style: PageBorderStyle; accent: string }) {
  switch (style) {
    case 'hairline':
      return <div className="border-overlay hairline" style={{ borderColor: `${accent}60` }} />;
    case 'thick-mat':
      return <div className="border-overlay thick-mat" style={{ background: `${accent}12` }} />;
    case 'double-line':
      return (
        <>
          <div className="border-overlay double-outer" style={{ borderColor: `${accent}50` }} />
          <div className="border-overlay double-inner" style={{ borderColor: `${accent}30` }} />
        </>
      );
    case 'corner-marks':
      return (
        <div className="border-overlay corner-marks-wrap">
          {(['tl','tr','bl','br'] as const).map(pos => (
            <div key={pos} className={`cm cm-${pos}`} style={{ borderColor: accent }} />
          ))}
        </div>
      );
    case 'inset-mat':
      return <div className="border-overlay inset-mat" style={{ boxShadow: `inset 0 0 0 18px ${accent}18, inset 0 0 0 20px ${accent}40` }} />;
    default:
      return null;
  }
}
