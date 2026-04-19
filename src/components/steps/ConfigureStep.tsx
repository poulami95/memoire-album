// src/components/steps/ConfigureStep.tsx
import React from 'react';
import { useAlbum } from '../../context/AlbumContext';
import { OccasionType, AlbumLayout, AlbumSize, AlbumCoverStyle, PaperFinish } from '../../types';
import '../../styles/ConfigureStep.css';

const OCCASIONS: { id: OccasionType; label: string; icon: string; desc: string }[] = [
  { id: 'wedding',      label: 'Wedding',      icon: '💍', desc: 'Timeless love story' },
  { id: 'birthday',     label: 'Birthday',     icon: '🎂', desc: 'Celebrate milestones' },
  { id: 'graduation',   label: 'Graduation',   icon: '🎓', desc: 'A new chapter begins' },
  { id: 'anniversary',  label: 'Anniversary',  icon: '✨', desc: 'Years well loved' },
  { id: 'travel',       label: 'Travel',       icon: '✈️', desc: 'Adventures & wanderlust' },
  { id: 'family',       label: 'Family',       icon: '🏡', desc: 'Moments to treasure' },
  { id: 'corporate',    label: 'Corporate',    icon: '💼', desc: 'Team milestones' },
  { id: 'baby_shower',  label: 'Baby Shower',  icon: '🍼', desc: 'New life, new joy' },
  { id: 'holiday',      label: 'Holiday',      icon: '🌟', desc: 'Seasonal memories' },
  { id: 'other',        label: 'Other',        icon: '◈', desc: 'Your unique story' },
];

const LAYOUTS: { id: AlbumLayout; label: string; desc: string }[] = [
  { id: 'modern',    label: 'Modern',    desc: 'Clean asymmetric compositions' },
  { id: 'classic',   label: 'Classic',   desc: 'Timeless centered layouts' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine-style spreads' },
  { id: 'polaroid',  label: 'Polaroid',  desc: 'Playful white-frame photos' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Widescreen panoramic feel' },
  { id: 'scrapbook', label: 'Scrapbook', desc: 'Layered, collage-style pages' },
];

const COLOR_THEMES = [
  { label: 'Warm Gold',    value: '#C9963A' },
  { label: 'Deep Forest',  value: '#2D6A4F' },
  { label: 'Blush Rose',   value: '#D4998A' },
  { label: 'Midnight',     value: '#1A1A2E' },
  { label: 'Ivory Classic',value: '#8B7355' },
  { label: 'Slate Blue',   value: '#5B7FA6' },
  { label: 'Terracotta',   value: '#B5522A' },
  { label: 'Lilac',        value: '#9B7FC0' },
];

const PAGE_PRESETS = [8, 12, 16, 20, 24, 32, 40, 48];

const VISION_CHIPS = [
  'Minimalist & clean',
  'Warm & romantic',
  'Dark & moody',
  'Bright & airy',
  'Botanical & natural',
  'Vintage & film',
  'Bold & editorial',
  'Soft pastels',
];

export default function ConfigureStep() {
  const { state, updateConfig, setStep } = useAlbum();
  const config = state.project.config;

  const update = (k: string) => (v: any) => updateConfig({ [k]: v } as any);

  const canProceed =
    config.eventTitle.trim().length >= 2 &&
    config.occasion;

  return (
    <div className="configure-step animate-fade-up">
      <div className="configure-hero">
        <div className="configure-ornament">✦ ✦ ✦</div>
        <h2 className="configure-title">Shape Your Album</h2>
        <p className="configure-subtitle">
          Tell us about your event so the AI can craft the perfect narrative.
        </p>
      </div>

      <div className="configure-grid">
        {/* ── Left column ── */}
        <div className="configure-left">

          {/* Occasion */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">01</span>
              Occasion
            </h3>
            <div className="occasion-grid">
              {OCCASIONS.map(occ => (
                <button
                  key={occ.id}
                  className={`occasion-card ${config.occasion === occ.id ? 'active' : ''}`}
                  onClick={() => update('occasion')(occ.id)}
                >
                  <span className="occasion-icon">{occ.icon}</span>
                  <span className="occasion-label">{occ.label}</span>
                  <span className="occasion-desc">{occ.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Event details */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">02</span>
              Album Details
            </h3>
            <div className="field-group">
              <label className="field-label">Album Title *</label>
              <input
                className="input"
                placeholder="e.g. Sarah & James — June 2025"
                value={config.eventTitle}
                onChange={e => update('eventTitle')(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Event Date</label>
                <input
                  className="input"
                  type="date"
                  value={config.eventDate || ''}
                  onChange={e => update('eventDate')(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Cover Subtitle</label>
                <input
                  className="input"
                  placeholder="A day to remember"
                  value={config.coverSubtitle || ''}
                  onChange={e => update('coverSubtitle')(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>
          </section>

          {/* Creative Vision */}
          <section className="config-section vision-section">
            <h3 className="config-section-title">
              <span className="section-num">03</span>
              Creative Vision
            </h3>
            <p className="vision-hint">
              Describe the look, feel, and style you want. AI will use this to design layouts,
              choose colour palettes, and write captions.
            </p>
            <div className="field-group">
              <textarea
                className="input vision-input"
                placeholder="e.g. Green and white minimalistic wedding photo book, soft botanical, clean typography, airy and romantic…"
                value={config.stylePrompt || ''}
                onChange={e => update('stylePrompt')(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <span className="char-count">{(config.stylePrompt || '').length}/300</span>
            </div>
            <div className="vision-chips">
              {VISION_CHIPS.map(chip => (
                <button
                  key={chip}
                  className="vision-chip"
                  onClick={() => {
                    const current = config.stylePrompt || '';
                    const sep = current && !current.endsWith(', ') ? ', ' : '';
                    update('stylePrompt')(current + sep + chip);
                  }}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* ── Right column ── */}
        <div className="configure-right">

          {/* Pages */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">04</span>
              Page Count
            </h3>
            <div className="page-preset-grid">
              {PAGE_PRESETS.map(n => (
                <button
                  key={n}
                  className={`page-preset ${config.pageCount === n ? 'active' : ''}`}
                  onClick={() => update('pageCount')(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="page-custom">
              <label className="field-label">Or enter custom</label>
              <input
                className="input"
                type="number"
                min={4}
                max={100}
                value={config.pageCount}
                onChange={e => update('pageCount')(parseInt(e.target.value) || 12)}
                style={{ width: '120px' }}
              />
              <span className="page-custom-hint">pages (4–100)</span>
            </div>
          </section>

          {/* Layout style */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">05</span>
              Layout Style
            </h3>
            <div className="layout-grid">
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  className={`layout-card ${config.layout === l.id ? 'active' : ''}`}
                  onClick={() => update('layout')(l.id)}
                >
                  <div className="layout-preview">
                    <LayoutPreview id={l.id} />
                  </div>
                  <p className="layout-name">{l.label}</p>
                  <p className="layout-desc">{l.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Physical options */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">06</span>
              Print Specifications
            </h3>
            <div className="spec-grid">
              <div className="field-group">
                <label className="field-label">Album Size</label>
                <select
                  className="input"
                  value={config.size}
                  onChange={e => update('size')(e.target.value)}
                >
                  <option value="landscape">Landscape (A4)</option>
                  <option value="portrait">Portrait (A5)</option>
                  <option value="square">Square (20×20cm)</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Cover Style</label>
                <select
                  className="input"
                  value={config.coverStyle}
                  onChange={e => update('coverStyle')(e.target.value)}
                >
                  <option value="hardcover">Hardcover</option>
                  <option value="softcover">Softcover</option>
                  <option value="layflat">Layflat (premium)</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Paper Finish</label>
                <select
                  className="input"
                  value={config.paperFinish}
                  onChange={e => update('paperFinish')(e.target.value)}
                >
                  <option value="glossy">Glossy</option>
                  <option value="matte">Matte</option>
                  <option value="lustre">Lustre</option>
                </select>
              </div>
            </div>
          </section>

          {/* Color theme */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">07</span>
              Colour Theme
            </h3>
            <div className="color-theme-grid">
              {COLOR_THEMES.map(t => (
                <button
                  key={t.value}
                  className={`color-swatch ${config.colorTheme === t.value ? 'active' : ''}`}
                  style={{ '--swatch-color': t.value } as React.CSSProperties}
                  onClick={() => update('colorTheme')(t.value)}
                  title={t.label}
                >
                  <span className="sr-only">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Toggle options */}
          <section className="config-section">
            <h3 className="config-section-title">
              <span className="section-num">08</span>
              Options
            </h3>
            <div className="toggle-options">
              <label className="toggle-row">
                <div>
                  <p className="toggle-label">AI-generated captions</p>
                  <p className="toggle-hint">Claude writes a poetic caption for each page</p>
                </div>
                <Toggle
                  checked={config.includeCaption}
                  onChange={v => update('includeCaption')(v)}
                />
              </label>
              <label className="toggle-row">
                <div>
                  <p className="toggle-label">Date stamps</p>
                  <p className="toggle-hint">Show event date on relevant pages</p>
                </div>
                <Toggle
                  checked={config.includeDateStamp}
                  onChange={v => update('includeDateStamp')(v)}
                />
              </label>
            </div>
          </section>

        </div>
      </div>

      {/* ── Actions ── */}
      <div className="configure-actions">
        <button className="btn btn-outline" onClick={() => setStep('upload')}>
          ← Back
        </button>
        <div className="configure-actions-right">
          {!canProceed && (
            <p className="configure-warning">
              Please fill in the album title and choose an occasion
            </p>
          )}
          <button
            className="btn btn-gold"
            style={{ padding: '14px 40px', fontSize: '14px' }}
            onClick={() => setStep('processing')}
            disabled={!canProceed}
          >
            Generate Album →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Layout preview mini-SVGs ── */
function LayoutPreview({ id }: { id: AlbumLayout }) {
  const fill = 'rgba(122,92,62,0.25)';
  const bg = 'transparent';
  const r = 2;
  switch (id) {
    case 'modern':
      return <svg viewBox="0 0 40 26"><rect x="0" y="0" width="24" height="26" rx={r} fill={fill}/><rect x="26" y="0" width="14" height="12" rx={r} fill={fill}/><rect x="26" y="14" width="14" height="12" rx={r} fill={fill}/></svg>;
    case 'classic':
      return <svg viewBox="0 0 40 26"><rect x="4" y="4" width="32" height="18" rx={r} fill={fill}/></svg>;
    case 'editorial':
      return <svg viewBox="0 0 40 26"><rect x="0" y="0" width="40" height="14" rx={r} fill={fill}/><rect x="0" y="16" width="18" height="10" rx={r} fill={fill}/><rect x="22" y="16" width="18" height="10" rx={r} fill={fill}/></svg>;
    case 'polaroid':
      return <svg viewBox="0 0 40 26"><rect x="2" y="0" width="16" height="20" rx={r} fill={fill}/><rect x="22" y="4" width="16" height="20" rx={r} fill={fill}/></svg>;
    case 'cinematic':
      return <svg viewBox="0 0 40 26"><rect x="0" y="4" width="40" height="18" rx={r} fill={fill}/></svg>;
    case 'scrapbook':
      return <svg viewBox="0 0 40 26" transform="rotate(-2)"><rect x="0" y="2" width="20" height="14" rx={r} fill={fill} transform="rotate(-3 10 9)"/><rect x="18" y="8" width="20" height="14" rx={r} fill={fill} transform="rotate(4 28 15)"/></svg>;
    default:
      return <svg viewBox="0 0 40 26"><rect x="0" y="0" width="40" height="26" rx={r} fill={fill}/></svg>;
  }
}

/* ── Toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
    >
      <span className="toggle-thumb" />
    </button>
  );
}
