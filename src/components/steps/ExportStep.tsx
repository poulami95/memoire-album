// src/components/steps/ExportStep.tsx
import React, { useState } from 'react';
import { useAlbum } from '../../context/AlbumContext';
import { exportAlbumToPDF, downloadBlob, printingVendors } from '../../utils/exportService';
import AlbumPageRenderer from '../AlbumPageRenderer';
import toast from 'react-hot-toast';
import '../../styles/ExportStep.css';

export default function ExportStep() {
  const { state, setStep, resetProject } = useAlbum();
  const { project } = state;
  const config = project.config;
  const pages = project.pages;

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [showExportPages, setShowExportPages] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setShowExportPages(true);

    // Wait for React to mount the hidden pages and for blob-URL images to paint
    await new Promise<void>(resolve => setTimeout(resolve, 300));

    // Wait for any images still loading
    const container = document.getElementById('export-pages-container');
    if (container) {
      const imgs = Array.from(container.querySelectorAll('img'));
      await Promise.all(imgs.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>(res => { img.onload = img.onerror = () => res(); })
      ));
    }

    try {
      toast('Generating PDF…', { icon: '⬦' });
      const blob = await exportAlbumToPDF(config, pages, setExportProgress);
      const filename = `${config.eventTitle.replace(/[^a-z0-9]/gi, '_')}_Album.pdf`;
      downloadBlob(blob, filename);
      toast.success('PDF downloaded! ✦');
    } catch (err: any) {
      toast.error('PDF export failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
      setShowExportPages(false);
    }
  };

  const handlePrintVendor = (vendorId: string) => {
    const vendor = printingVendors.find(v => v.id === vendorId);
    if (!vendor) return;
    // In production: first export PDF, then integrate with vendor API
    toast(`Opening ${vendor.name} in a new tab…`, { icon: '◈' });
    window.open(vendor.website, '_blank', 'noopener noreferrer');
  };

  const selectedVendorInfo = printingVendors.find(v => v.id === selectedVendor);

  return (
    <div className="export-step animate-fade-up">
      {/* ── Hero ── */}
      <div className="export-hero">
        <div className="export-hero-ornament">✦ ✦ ✦</div>
        <h2 className="export-title">Your Album is Ready</h2>
        <p className="export-subtitle">
          Download as PDF or send directly to a printing service.
        </p>
        {/* Summary badge */}
        <div className="album-summary-pills">
          <span className="summary-pill">
            <strong>{pages.length}</strong> pages
          </span>
          <span className="summary-pill">
            <strong>{config.size}</strong>
          </span>
          <span className="summary-pill">
            <strong>{config.coverStyle}</strong>
          </span>
          <span className="summary-pill">
            <strong>{config.paperFinish}</strong> finish
          </span>
        </div>
      </div>

      <div className="export-grid">
        {/* ── Download column ── */}
        <div className="export-card download-card">
          <div className="export-card-icon" style={{ color: '#C9963A' }}>⬦</div>
          <h3 className="export-card-title">Download PDF</h3>
          <p className="export-card-desc">
            Export your album as a high-resolution PDF, ready to print at any local shop or at home.
          </p>

          <div className="pdf-specs">
            <div className="spec-row">
              <span>Format</span>
              <span>{config.size === 'landscape' ? 'A4 Landscape' : config.size === 'portrait' ? 'A5 Portrait' : '20×20 cm Square'}</span>
            </div>
            <div className="spec-row">
              <span>Pages</span>
              <span>{pages.length} pages</span>
            </div>
            <div className="spec-row">
              <span>Resolution</span>
              <span>300 DPI (print-ready)</span>
            </div>
            <div className="spec-row">
              <span>Colour profile</span>
              <span>sRGB</span>
            </div>
          </div>

          {isExporting && (
            <div className="export-progress">
              <div className="export-progress-track">
                <div className="export-progress-fill" style={{ width: `${exportProgress}%` }} />
              </div>
              <p className="export-progress-label">Rendering pages… {exportProgress}%</p>
            </div>
          )}

          <button
            className="btn btn-gold export-download-btn"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <><span className="animate-spin">◈</span> Generating…</>
            ) : (
              '⬇ Download PDF'
            )}
          </button>

          <p className="export-note">
            PDF is generated entirely in your browser — your photos stay private.
          </p>
        </div>

        {/* ── Print column ── */}
        <div className="export-card print-card">
          <div className="export-card-icon" style={{ color: '#6B7C5E' }}>◈</div>
          <h3 className="export-card-title">Send for Printing</h3>
          <p className="export-card-desc">
            Partner with a professional printing service to get a physical album shipped to your door.
          </p>

          <div className="vendor-list">
            {printingVendors.map(vendor => (
              <button
                key={vendor.id}
                className={`vendor-card ${selectedVendor === vendor.id ? 'selected' : ''}`}
                onClick={() => setSelectedVendor(
                  selectedVendor === vendor.id ? null : vendor.id
                )}
              >
                <div
                  className="vendor-dot"
                  style={{ background: vendor.logoColor }}
                />
                <div className="vendor-info">
                  <div className="vendor-name-row">
                    <span className="vendor-name">{vendor.name}</span>
                    {vendor.shipsToIndia && (
                      <span className="vendor-badge india">🇮🇳 India</span>
                    )}
                    {vendor.apiAvailable && (
                      <span className="vendor-badge api">API</span>
                    )}
                  </div>
                  <p className="vendor-desc">{vendor.description}</p>
                  <div className="vendor-meta">
                    <span>{vendor.priceRange}</span>
                    <span>·</span>
                    <span>{vendor.turnaround}</span>
                  </div>
                </div>
                <div className="vendor-arrow">›</div>
              </button>
            ))}
          </div>

          {selectedVendorInfo && (
            <div className="vendor-cta">
              <p className="vendor-cta-note">
                {selectedVendorInfo.apiAvailable
                  ? '✦ This vendor has an API — direct upload integration coming soon.'
                  : '◈ Download your PDF first, then upload it on their website.'}
              </p>
              <div className="vendor-cta-actions">
                <button
                  className="btn btn-outline"
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                >
                  ⬇ Download PDF first
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handlePrintVendor(selectedVendorInfo.id)}
                >
                  Open {selectedVendorInfo.name} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Printing workflow guide ── */}
      <div className="print-guide">
        <h3 className="print-guide-title">How to Order Prints</h3>
        <div className="print-steps">
          {[
            { num: '01', title: 'Download your PDF', desc: 'Click the download button above to get your album as a print-ready PDF file.' },
            { num: '02', title: 'Choose a vendor', desc: 'Select from our recommended printing partners — Zoomin & PrintMyLook ship across India.' },
            { num: '03', title: 'Upload & customise', desc: "On the vendor's website, upload your PDF and select your cover, paper, and binding preferences." },
            { num: '04', title: 'Place your order', desc: 'Pay securely and get your beautiful physical album delivered to your doorstep.' },
          ].map(step => (
            <div key={step.num} className="print-step">
              <div className="print-step-num">{step.num}</div>
              <div>
                <p className="print-step-title">{step.title}</p>
                <p className="print-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden off-screen pages rendered for PDF capture */}
      {showExportPages && (() => {
        const isLandscape = config.size === 'landscape';
        const isPortrait  = config.size === 'portrait';
        const w = isLandscape ? 900 : isPortrait ? 600 : 720;
        const h = isLandscape ? 637 : isPortrait ? 852 : 720;
        return (
          <div
            id="export-pages-container"
            style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}
          >
            {pages.map(page => (
              <div key={page.id} id={`album-page-${page.id}`} style={{ width: w, height: h, position: 'absolute' }}>
                <AlbumPageRenderer page={page} config={config} />
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Actions ── */}
      <div className="export-actions">
        <button className="btn btn-outline" onClick={() => setStep('preview')}>
          ← Back to Preview
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('Start a new album? This will clear your current project.')) {
              resetProject();
            }
          }}
        >
          ✦ New Album
        </button>
      </div>
    </div>
  );
}
