// src/components/steps/PreviewStep.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useAlbum } from '../../context/AlbumContext';
import { AlbumPage, AlbumPageImage, PageBorderStyle, NarrativeContent } from '../../types';
import AlbumPageRenderer from '../AlbumPageRenderer';
import { LAYOUT_OPTIONS, getLayout } from '../../utils/aiService';
import toast from 'react-hot-toast';
import '../../styles/PreviewStep.css';

const BORDER_STYLES: { id: PageBorderStyle; label: string; icon: string }[] = [
  { id: 'none',         label: 'None',        icon: '○' },
  { id: 'hairline',     label: 'Hairline',    icon: '□' },
  { id: 'double-line',  label: 'Double Line', icon: '⊡' },
  { id: 'corner-marks', label: 'Corner Marks',icon: '⌐' },
  { id: 'thick-mat',    label: 'Thick Mat',   icon: '▣' },
  { id: 'inset-mat',    label: 'Inset Mat',   icon: '◫' },
];

type EditPanel = 'none' | 'layout' | 'border' | 'cover' | 'narrative' | 'caption' | 'photos';
type FlipState = 'idle' | 'out' | 'in';
type FlipDir = 'next' | 'prev';

interface ReplaceTarget { page: AlbumPage; slotIdx: number }

export default function PreviewStep() {
  const { state, setStep, updatePage, dispatch } = useAlbum();
  const { project } = state;
  const pages = project.pages;
  const config = project.config;

  // ── Navigation with page-turn animation ──
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [displayIdx, setDisplayIdx]         = useState(0);   // what's actually rendered
  const [flipState, setFlipState]           = useState<FlipState>('idle');
  const [flipDir, setFlipDir]               = useState<FlipDir>('next');
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Edit panels ──
  const [activePanel, setActivePanel] = useState<EditPanel>('none');

  // ── Caption editing ──
  const [captionDraft, setCaptionDraft] = useState('');

  // ── Cover editing ──
  const [coverTitleDraft, setCoverTitleDraft]       = useState(config.coverTitle || config.eventTitle);
  const [coverSubtitleDraft, setCoverSubtitleDraft] = useState(config.coverSubtitle || '');
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // ── Narrative editing ──
  const [narrativeDraft, setNarrativeDraft] = useState<NarrativeContent>({ heading: '', subheading: '', body: '' });

  // ── Photo replacement ──
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget | null>(null);
  const slotImageInputRef = useRef<HTMLInputElement>(null);

  const currentPage = pages[displayIdx];
  const isCover     = currentPage?.pageNumber === 1;
  const isNarrative = !!(currentPage?.textContent && currentPage.images.length === 0 && !isCover);
  const isSoloPage  = isCover || currentPage?.pageNumber === config.pageCount;

  const leftPage  = displayIdx % 2 === 0 ? pages[displayIdx]     : pages[displayIdx - 1];
  const rightPage = displayIdx % 2 === 0 ? pages[displayIdx + 1] : pages[displayIdx];

  // ── Animated navigation ──
  const goTo = useCallback((i: number) => {
    if (flipState !== 'idle') return;
    const clamped = Math.max(0, Math.min(pages.length - 1, i));
    if (clamped === currentPageIdx) return;

    const dir: FlipDir = clamped > currentPageIdx ? 'next' : 'prev';
    setFlipDir(dir);
    setFlipState('out');
    setActivePanel('none');

    const t1 = setTimeout(() => {
      setDisplayIdx(clamped);
      setCurrentPageIdx(clamped);
      setFlipState('in');

      const t2 = setTimeout(() => {
        setFlipState('idle');
      }, 240);
      flipTimers.current.push(t2);
    }, 180);
    flipTimers.current.push(t1);
  }, [flipState, currentPageIdx, pages.length]);

  // ── Panels ──
  const togglePanel = (panel: EditPanel) => {
    if (activePanel === panel) { setActivePanel('none'); return; }
    if (panel === 'caption')   setCaptionDraft(currentPage?.caption || '');
    if (panel === 'cover') {
      setCoverTitleDraft(config.coverTitle || config.eventTitle);
      setCoverSubtitleDraft(config.coverSubtitle || '');
    }
    if (panel === 'narrative' && currentPage?.textContent) {
      setNarrativeDraft({
        heading:    currentPage.textContent.heading,
        subheading: currentPage.textContent.subheading || '',
        body:       currentPage.textContent.body || '',
      });
    }
    setActivePanel(panel);
  };

  const saveCaption = () => {
    if (!currentPage) return;
    updatePage({ ...currentPage, caption: captionDraft });
    setActivePanel('none');
    toast.success('Caption saved');
  };

  const saveCover = () => {
    dispatch({ type: 'SET_CONFIG', payload: { coverTitle: coverTitleDraft, coverSubtitle: coverSubtitleDraft } });
    setActivePanel('none');
    toast.success('Cover updated');
  };

  const saveNarrative = () => {
    if (!currentPage) return;
    updatePage({ ...currentPage, textContent: narrativeDraft });
    setActivePanel('none');
    toast.success('Text page saved');
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPage) return;
    const url = URL.createObjectURL(file);
    updatePage({ ...currentPage, images: [{ imageId: `cover_${Date.now()}`, url, position: { x: 0, y: 0, width: 100, height: 100 } }] });
    toast.success('Cover photo updated');
  };

  // ── Slot photo replacement ──
  const handleReplaceSlot = (page: AlbumPage, slotIdx: number) => {
    setReplaceTarget({ page, slotIdx });
    // small delay so the state is set before the click
    setTimeout(() => slotImageInputRef.current?.click(), 10);
  };

  const handleSlotImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTarget) return;
    const url = URL.createObjectURL(file);
    const { page, slotIdx } = replaceTarget;
    const newImages = page.images.map((img, i) =>
      i === slotIdx ? { ...img, url, imageId: `replaced_${Date.now()}` } : img
    );
    updatePage({ ...page, images: newImages });
    toast.success('Photo replaced ✦');
    setReplaceTarget(null);
    // reset input so same file can be re-selected
    if (slotImageInputRef.current) slotImageInputRef.current.value = '';
  };

  const changePageLayout = (newLayoutId: string) => {
    if (!currentPage) return;
    const newLayout  = getLayout(newLayoutId, 4);
    const currentIds = new Set(currentPage.images.map(pi => pi.imageId));
    const extra: AlbumPageImage[] = project.images
      .filter(si => si.selected && !currentIds.has(si.id))
      .map(si => ({ imageId: si.id, url: si.url, position: newLayout.slots[0], caption: si.aiCaption }));
    const pool = [...currentPage.images, ...extra];
    if (!pool.length) return;
    const newPageImages = newLayout.slots.map((slot, i) => ({ ...pool[i % pool.length], position: slot }));
    updatePage({ ...currentPage, layout: newLayout, images: newPageImages });
    setActivePanel('none');
    toast.success(`Layout → "${newLayout.name}"`);
  };

  const changeBorderStyle = (style: PageBorderStyle) => {
    if (!currentPage) return;
    updatePage({ ...currentPage, pageStyle: style });
    toast.success(`Border: ${style === 'none' ? 'removed' : style}`);
  };

  if (pages.length === 0) {
    return (
      <div className="preview-empty">
        <p>No pages generated yet.</p>
        <button className="btn btn-outline" onClick={() => setStep('configure')}>← Back to configure</button>
      </div>
    );
  }

  // ── Spread animation class ──
  const spreadAnimClass =
    flipState === 'out' ? `flip-out-${flipDir}` :
    flipState === 'in'  ? `flip-in-${flipDir}`  : '';

  return (
    <div className="preview-step animate-fade-up">
      {/* Hidden inputs */}
      <input ref={coverImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverImageChange} />
      <input ref={slotImageInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSlotImageFile} />

      {/* ── Hero ── */}
      <div className="preview-hero">
        <div className="preview-hero-ornament">✦ ✦ ✦</div>
        <h2 className="preview-title">{config.eventTitle}</h2>
        <p className="preview-subtitle">
          {pages.length} pages · {project.images.filter(i => i.selected).length} photos curated by AI
        </p>
      </div>

      <div className="preview-layout">
        {/* ── Thumbnails sidebar ── */}
        <aside className="preview-sidebar">
          <p className="sidebar-label">Pages</p>
          <div className="thumb-scroll">
            {pages.map((page, i) => (
              <button
                key={page.id}
                className={`page-thumb ${i === currentPageIdx ? 'active' : ''}`}
                onClick={() => goTo(i)}
              >
                <div className="page-thumb-preview">
                  <AlbumPageRenderer page={page} config={config} thumbnail />
                </div>
                <span className="page-thumb-num">{page.pageNumber}</span>
                {page.textContent && page.images.length === 0 && page.pageNumber !== 1 && (
                  <span className="thumb-narrative-badge">✦</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="preview-main">
          {/* ── Book spread ── */}
          <div className={`book-spread-wrap ${isSoloPage ? 'solo' : ''}`}>

            {!isSoloPage && (
              <div className={`book-spread ${spreadAnimClass}`}>
                {/* Left page */}
                <div
                  className={`spread-page spread-left ${displayIdx % 2 !== 0 ? 'spread-active' : ''}`}
                  onClick={() => leftPage && goTo(pages.indexOf(leftPage))}
                  id={leftPage ? `album-page-${leftPage.id}` : undefined}
                >
                  {leftPage
                    ? <AlbumPageRenderer
                        page={leftPage}
                        config={config}
                        onReplaceSlot={(si) => handleReplaceSlot(leftPage, si)}
                      />
                    : <div className="spread-page-empty" />
                  }
                </div>

                {/* Spine */}
                <div className="book-spine" />

                {/* Right page */}
                <div
                  className={`spread-page spread-right ${displayIdx % 2 === 0 ? 'spread-active' : ''}`}
                  onClick={() => rightPage && goTo(pages.indexOf(rightPage))}
                  id={rightPage ? `album-page-${rightPage.id}` : undefined}
                >
                  {rightPage
                    ? <AlbumPageRenderer
                        page={rightPage}
                        config={config}
                        onReplaceSlot={(si) => handleReplaceSlot(rightPage, si)}
                      />
                    : <div className="spread-page-empty" />
                  }
                </div>
              </div>
            )}

            {/* Solo cover/back */}
            {isSoloPage && (
              <div className={`solo-page-wrap ${spreadAnimClass}`} id={`album-page-${currentPage?.id}`}>
                {currentPage && (
                  <AlbumPageRenderer
                    page={currentPage}
                    config={config}
                    onReplaceSlot={(si) => handleReplaceSlot(currentPage, si)}
                  />
                )}
              </div>
            )}

            {/* Page-turn arrow buttons */}
            {currentPageIdx > 0 && (
              <button className="page-turn page-turn-left" onClick={() => goTo(currentPageIdx - (isSoloPage ? 1 : 2))} title="Previous">
                <span className="pt-arrow">‹</span>
              </button>
            )}
            {currentPageIdx < pages.length - 1 && (
              <button className="page-turn page-turn-right" onClick={() => goTo(currentPageIdx + (isSoloPage ? 1 : 2))} title="Next">
                <span className="pt-arrow">›</span>
              </button>
            )}
          </div>

          {/* ── Editing toolbar ── */}
          <div className="edit-toolbar">
            {isCover && (
              <button className={`tool-btn ${activePanel === 'cover' ? 'active' : ''}`} onClick={() => togglePanel('cover')}>
                ✎ Edit Cover
              </button>
            )}
            {isNarrative && (
              <button className={`tool-btn ${activePanel === 'narrative' ? 'active' : ''}`} onClick={() => togglePanel('narrative')}>
                ✎ Edit Text
              </button>
            )}
            {!isCover && !isNarrative && (
              <>
                <button className={`tool-btn ${activePanel === 'photos' ? 'active' : ''}`} onClick={() => togglePanel('photos')}>
                  ⬆ Photos
                </button>
                <button className={`tool-btn ${activePanel === 'layout' ? 'active' : ''}`} onClick={() => togglePanel('layout')}>
                  ⊞ Layout
                </button>
                <button className={`tool-btn ${activePanel === 'border' ? 'active' : ''}`} onClick={() => togglePanel('border')}>
                  ◫ Border
                </button>
                {config.includeCaption && (
                  <button className={`tool-btn ${activePanel === 'caption' ? 'active' : ''}`} onClick={() => togglePanel('caption')}>
                    ✎ Caption
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Edit panels ── */}

          {/* Photos panel */}
          {activePanel === 'photos' && currentPage && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Replace Photos on This Page</p>
              <p className="panel-hint">Click a slot below to replace that photo, or click directly on any photo in the spread above.</p>
              <div className="slot-grid">
                {currentPage.images.map((img, slotIdx) => (
                  <button
                    key={slotIdx}
                    className="slot-replace-card"
                    onClick={() => handleReplaceSlot(currentPage, slotIdx)}
                  >
                    <div className="slot-replace-thumb">
                      {img.url
                        ? <img src={img.url} alt={`Slot ${slotIdx + 1}`} className="slot-replace-img" />
                        : <span className="slot-replace-placeholder">◈</span>
                      }
                      <div className="slot-replace-overlay">
                        <span className="slot-replace-icon">⬆</span>
                        <span className="slot-replace-text">Replace</span>
                      </div>
                    </div>
                    <span className="slot-replace-label">Photo {slotIdx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cover editor */}
          {activePanel === 'cover' && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Edit Front Cover</p>
              <div className="field-group-sm">
                <label className="panel-label">Cover Title</label>
                <input className="input" value={coverTitleDraft} onChange={e => setCoverTitleDraft(e.target.value)} maxLength={80} />
              </div>
              <div className="field-group-sm">
                <label className="panel-label">Cover Subtitle</label>
                <input className="input" value={coverSubtitleDraft} onChange={e => setCoverSubtitleDraft(e.target.value)} maxLength={60} placeholder="A day to remember" />
              </div>
              <div className="field-group-sm">
                <label className="panel-label">Cover Image</label>
                <button className="btn btn-outline cover-img-btn" onClick={() => coverImageInputRef.current?.click()}>
                  ⬆ Replace Cover Photo
                </button>
              </div>
              <div className="panel-actions">
                <button className="btn btn-ghost" onClick={() => setActivePanel('none')}>Cancel</button>
                <button className="btn btn-primary" onClick={saveCover}>Save Cover</button>
              </div>
            </div>
          )}

          {/* Narrative editor */}
          {activePanel === 'narrative' && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Edit Text Page</p>
              <div className="field-group-sm">
                <label className="panel-label">Heading</label>
                <input className="input" value={narrativeDraft.heading} onChange={e => setNarrativeDraft(d => ({ ...d, heading: e.target.value }))} placeholder="e.g. The Ceremony" maxLength={60} />
              </div>
              <div className="field-group-sm">
                <label className="panel-label">Subheading <span className="panel-label-optional">(optional)</span></label>
                <input className="input" value={narrativeDraft.subheading || ''} onChange={e => setNarrativeDraft(d => ({ ...d, subheading: e.target.value }))} placeholder="Everything's better when we're together" maxLength={80} />
              </div>
              <div className="field-group-sm">
                <label className="panel-label">Body text <span className="panel-label-optional">(optional)</span></label>
                <textarea className="input" rows={4} value={narrativeDraft.body || ''} onChange={e => setNarrativeDraft(d => ({ ...d, body: e.target.value }))} placeholder="A few poetic sentences about what follows…" maxLength={400} />
              </div>
              <div className="panel-actions">
                <button className="btn btn-ghost" onClick={() => setActivePanel('none')}>Cancel</button>
                <button className="btn btn-primary" onClick={saveNarrative}>Save</button>
              </div>
            </div>
          )}

          {/* Layout picker */}
          {activePanel === 'layout' && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Change Layout</p>
              <div className="layout-options">
                {LAYOUT_OPTIONS.map(opt => (
                  <button key={opt.id} className={`layout-option ${currentPage?.layout.id === opt.id ? 'active' : ''}`} onClick={() => changePageLayout(opt.id)}>
                    <div className={`layout-preview layout-preview--${opt.id}`}>
                      {opt.id === 'full-bleed' && <div className="lp-block lp-full" />}
                      {opt.id === 'two-equal'  && (<><div className="lp-block lp-half-left" /><div className="lp-block lp-half-right" /></>)}
                      {opt.id === 'hero-two'   && (<><div className="lp-block lp-hero" /><div className="lp-block lp-side-top" /><div className="lp-block lp-side-bottom" /></>)}
                      {opt.id === 'three-row'  && (<><div className="lp-block lp-row" /><div className="lp-block lp-row" /><div className="lp-block lp-row" /></>)}
                      {opt.id === 'four-grid'  && (<><div className="lp-block lp-quad" /><div className="lp-block lp-quad" /><div className="lp-block lp-quad" /><div className="lp-block lp-quad" /></>)}
                    </div>
                    <span className="layout-option-name">{opt.name}</span>
                    <span className="layout-option-count">{opt.imageCount} photo{opt.imageCount > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Border picker */}
          {activePanel === 'border' && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Page Border & Backdrop</p>
              <div className="border-options">
                {BORDER_STYLES.map(bs => (
                  <button
                    key={bs.id}
                    className={`border-option ${currentPage?.pageStyle === bs.id || (!currentPage?.pageStyle && bs.id === 'none') ? 'active' : ''}`}
                    onClick={() => changeBorderStyle(bs.id)}
                  >
                    <span className="border-option-icon">{bs.icon}</span>
                    <span className="border-option-label">{bs.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption editor */}
          {activePanel === 'caption' && (
            <div className="edit-panel animate-panel">
              <p className="panel-title">Page Caption</p>
              <input className="input caption-input" value={captionDraft} onChange={e => setCaptionDraft(e.target.value)} placeholder="Enter page caption…" maxLength={80} autoFocus />
              <div className="panel-actions">
                <button className="btn btn-ghost" onClick={() => setActivePanel('none')}>Cancel</button>
                <button className="btn btn-primary" onClick={saveCaption}>Save</button>
              </div>
            </div>
          )}

          {/* ── Page navigation ── */}
          <div className="page-nav">
            <button className="btn btn-outline page-nav-btn" onClick={() => goTo(currentPageIdx - 1)} disabled={currentPageIdx === 0 || flipState !== 'idle'}>
              ← Prev
            </button>
            <span className="page-indicator">
              <span className="page-current">{currentPageIdx + 1}</span>
              <span className="page-sep"> / </span>
              <span className="page-total">{pages.length}</span>
            </span>
            <button className="btn btn-outline page-nav-btn" onClick={() => goTo(currentPageIdx + 1)} disabled={currentPageIdx === pages.length - 1 || flipState !== 'idle'}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="preview-actions">
        <button className="btn btn-outline" onClick={() => setStep('configure')}>← Edit Settings</button>
        <button className="btn btn-primary" onClick={() => setStep('export')}>Continue to Export →</button>
      </div>
    </div>
  );
}
