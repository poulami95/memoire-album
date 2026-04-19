// src/components/steps/UploadStep.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useAlbum } from '../../context/AlbumContext';
import { UploadedImage } from '../../types';
import { smartSelectImages } from '../../utils/aiService';
import '../../styles/UploadStep.css';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/gif': ['.gif'],
};

function createImageFromFile(file: File): UploadedImage {
  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    file,
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    source: 'upload',
    selected: true,
  };
}

export default function UploadStep() {
  const { state, addImages, removeImage, toggleImageSelect, setStep, dispatch } = useAlbum();
  const { project } = state;
  const images = project.images;

  const [driveLink, setDriveLink] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'drive' | 'url'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [hasAiScores, setHasAiScores] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newImages = accepted.map(createImageFromFile);
    addImages(newImages);
    toast.success(`${newImages.length} photo${newImages.length > 1 ? 's' : ''} added`);
  }, [addImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (files) => {
      toast.error(`${files.length} file(s) rejected — check format/size (max 20MB)`);
    },
  });

  const handleDriveLink = async () => {
    if (!driveLink.trim()) return;
    setIsLoadingDrive(true);
    try {
      // Parse Google Drive folder/file ID from URL
      const match = driveLink.match(/\/(?:folders|file\/d)\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        toast.error('Could not parse Google Drive link — please use a shared folder or file URL');
        return;
      }
      const fileId = match[1];
      // Construct direct image URL (works for publicly shared files)
      const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
      const img: UploadedImage = {
        id: `img_drive_${Date.now()}`,
        url,
        name: `Google Drive Image (${fileId.slice(0, 8)}…)`,
        source: 'google_drive',
        selected: true,
      };
      addImages([img]);
      setDriveLink('');
      toast.success('Google Drive image added — note: link must be publicly shared');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      const img: UploadedImage = {
        id: `img_url_${Date.now()}`,
        url: urlInput,
        name: urlInput.split('/').pop() || 'External Image',
        source: 'url',
        selected: true,
      };
      addImages([img]);
      setUrlInput('');
      toast.success('Image URL added');
    } catch {
      toast.error('Invalid URL');
    }
  };

  const handleAiSmartSelect = async () => {
    if (images.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    try {
      const analyzed = await smartSelectImages(images, (i, total) => {
        setAnalyzeProgress(Math.round((i / total) * 100));
      });
      analyzed.forEach(img => dispatch({ type: 'UPDATE_IMAGE', payload: img }));
      setHasAiScores(true);
      const selected = analyzed.filter(i => i.selected).length;
      toast.success(`AI picked ${selected} best photo${selected !== 1 ? 's' : ''} ✦`);
    } catch (err: any) {
      toast.error('AI selection failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
    }
  };

  const selectedCount = images.filter(i => i.selected).length;
  const canProceed = selectedCount >= 3;

  return (
    <div className="upload-step animate-fade-up">
      {/* ── Hero ── */}
      <div className="upload-hero">
        <div className="upload-hero-ornament">✦ ✦ ✦</div>
        <h2 className="upload-title">Begin Your Story</h2>
        <p className="upload-subtitle">
          Upload your photos — our AI will curate the finest moments<br />
          and weave them into a timeless album.
        </p>
      </div>

      {/* ── Source tabs ── */}
      <div className="source-tabs">
        {(['upload', 'drive', 'url'] as const).map(tab => (
          <button
            key={tab}
            className={`source-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'upload' && '⬆ Upload Files'}
            {tab === 'drive' && '◈ Google Drive'}
            {tab === 'url' && '⬦ Image URL'}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      {activeTab === 'upload' && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-inner">
            <div className="dropzone-icon animate-float">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 8L24 32M24 8L16 16M24 8L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 36H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 36V40H40V36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {isDragActive ? (
              <p className="dropzone-text active">Release to add photos</p>
            ) : (
              <>
                <p className="dropzone-text">Drag &amp; drop your photos here</p>
                <p className="dropzone-hint">or click to browse — JPG, PNG, WEBP, HEIC · Max 20MB each</p>
              </>
            )}
          </div>
          <div className="dropzone-border-anim" />
        </div>
      )}

      {activeTab === 'drive' && (
        <div className="link-panel">
          <div className="link-panel-icon">◈</div>
          <h3>Google Drive</h3>
          <p className="link-panel-desc">
            Share a Google Drive folder or individual image link.<br />
            Make sure the file/folder is set to <strong>"Anyone with the link can view."</strong>
          </p>
          <div className="link-input-row">
            <input
              className="input"
              placeholder="https://drive.google.com/file/d/…"
              value={driveLink}
              onChange={e => setDriveLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDriveLink()}
            />
            <button
              className="btn btn-primary"
              onClick={handleDriveLink}
              disabled={isLoadingDrive || !driveLink.trim()}
            >
              {isLoadingDrive ? '…' : 'Add'}
            </button>
          </div>
          <p className="link-note">
            💡 For best results, upload individual image files, not folders.<br />
            Folder import requires Google Drive API integration (coming soon).
          </p>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="link-panel">
          <div className="link-panel-icon">⬦</div>
          <h3>Image URL</h3>
          <p className="link-panel-desc">
            Paste a direct link to any publicly accessible image.
          </p>
          <div className="link-input-row">
            <input
              className="input"
              placeholder="https://example.com/photo.jpg"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
            />
            <button
              className="btn btn-primary"
              onClick={handleUrlAdd}
              disabled={!urlInput.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* ── Image grid ── */}
      {images.length > 0 && (
        <div className="image-grid-section">
          <div className="image-grid-header">
            <h3 className="image-grid-title">
              Your Photos
              <span className="image-count-badge">{images.length}</span>
            </h3>
            <div className="image-grid-header-right">
              {hasAiScores && (
                <p className="image-grid-hint">
                  {selectedCount} selected by AI · click to toggle
                </p>
              )}
              {!hasAiScores && (
                <p className="image-grid-hint">
                  {selectedCount} selected · AI will curate on generate
                </p>
              )}
              {images.length >= 2 && (
                <button
                  className={`btn ai-select-btn ${isAnalyzing ? 'loading' : ''}`}
                  onClick={handleAiSmartSelect}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="ai-select-spinner" />
                      Analysing {analyzeProgress}%
                    </>
                  ) : (
                    <>✦ AI Smart Select</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="image-grid">
            {images.map(img => (
              <div
                key={img.id}
                className={`image-card ${img.selected ? 'selected' : 'deselected'}`}
                onClick={() => toggleImageSelect(img.id)}
              >
                <div className="image-thumb-wrap">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="image-thumb"
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0e8d8" width="100" height="100"/><text y=".9em" font-size="80" text-anchor="middle" x="50">📷</text></svg>';
                    }}
                  />
                  <div className="image-select-overlay">
                    <div className="image-check">{img.selected ? '✓' : '+'}</div>
                  </div>
                  {img.source === 'google_drive' && (
                    <span className="image-source-badge">◈ Drive</span>
                  )}
                  {img.source === 'url' && (
                    <span className="image-source-badge">⬦ URL</span>
                  )}
                  {img.aiScore !== undefined && (
                    <span className={`ai-score-badge ${img.aiScore >= 75 ? 'high' : img.aiScore >= 55 ? 'mid' : 'low'}`}>
                      {img.aiScore}
                    </span>
                  )}
                </div>
                <div className="image-meta">
                  <p className="image-name">{img.name.length > 20 ? img.name.slice(0, 20) + '…' : img.name}</p>
                  {img.size && (
                    <p className="image-size">{(img.size / 1024 / 1024).toFixed(1)} MB</p>
                  )}
                </div>
                <button
                  className="image-remove-btn"
                  onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="upload-actions">
        {!canProceed && images.length > 0 && (
          <p className="upload-warning">Select at least 3 photos to continue</p>
        )}
        <button
          className="btn btn-gold"
          style={{ fontSize: '14px', padding: '14px 40px' }}
          onClick={() => setStep('configure')}
          disabled={!canProceed}
        >
          Continue to Customise →
        </button>
        {images.length === 0 && (
          <p className="upload-empty-hint">Upload at least 3 photos to get started</p>
        )}
      </div>
    </div>
  );
}
