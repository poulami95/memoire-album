// src/components/steps/PreviewStep.tsx
import React, { useState } from 'react';
import { useAlbum } from '../../context/AlbumContext';
import { AlbumPage } from '../../types';
import AlbumPageRenderer from '../AlbumPageRenderer';
import '../../styles/PreviewStep.css';

export default function PreviewStep() {
  const { state, setStep, updatePage } = useAlbum();
  const { project } = state;
  const pages = project.pages;
  const config = project.config;

  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');

  const currentPage = pages[currentPageIdx];

  const goTo = (i: number) => {
    setCurrentPageIdx(Math.max(0, Math.min(pages.length - 1, i)));
    setEditingCaption(null);
  };

  const saveCaption = () => {
    if (!currentPage) return;
    updatePage({ ...currentPage, caption: captionDraft });
    setEditingCaption(null);
  };

  const startEditCaption = () => {
    setCaptionDraft(currentPage?.caption || '');
    setEditingCaption(currentPage?.id || '');
  };

  if (pages.length === 0) {
    return (
      <div className="preview-empty">
        <p>No pages generated yet.</p>
        <button className="btn btn-outline" onClick={() => setStep('configure')}>
          ← Back to configure
        </button>
      </div>
    );
  }

  return (
    <div className="preview-step animate-fade-up">
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
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main page view ── */}
        <div className="preview-main">
          <div className="page-viewer">
            <div className="page-viewer-inner" id={`album-page-${currentPage?.id}`}>
              {currentPage && (
                <AlbumPageRenderer page={currentPage} config={config} />
              )}
            </div>
          </div>

          {/* ── Caption editor ── */}
          {config.includeCaption && currentPage && (
            <div className="caption-editor">
              {editingCaption === currentPage.id ? (
                <div className="caption-editing">
                  <input
                    className="input caption-input"
                    value={captionDraft}
                    onChange={e => setCaptionDraft(e.target.value)}
                    placeholder="Enter page caption…"
                    maxLength={80}
                    autoFocus
                  />
                  <div className="caption-actions">
                    <button className="btn btn-ghost" onClick={() => setEditingCaption(null)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={saveCaption}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="caption-display" onClick={startEditCaption}>
                  <span className="caption-text">
                    {currentPage.caption || <em>Click to add caption…</em>}
                  </span>
                  <span className="caption-edit-hint">✎ edit</span>
                </div>
              )}
            </div>
          )}

          {/* ── Page navigation ── */}
          <div className="page-nav">
            <button
              className="btn btn-outline page-nav-btn"
              onClick={() => goTo(currentPageIdx - 1)}
              disabled={currentPageIdx === 0}
            >
              ← Prev
            </button>
            <span className="page-indicator">
              <span className="page-current">{currentPageIdx + 1}</span>
              <span className="page-sep"> / </span>
              <span className="page-total">{pages.length}</span>
            </span>
            <button
              className="btn btn-outline page-nav-btn"
              onClick={() => goTo(currentPageIdx + 1)}
              disabled={currentPageIdx === pages.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="preview-actions">
        <button className="btn btn-outline" onClick={() => setStep('configure')}>
          ← Edit Settings
        </button>
        <div className="preview-actions-right">
          <button
            className="btn btn-primary"
            onClick={() => setStep('export')}
          >
            Continue to Export →
          </button>
        </div>
      </div>
    </div>
  );
}
