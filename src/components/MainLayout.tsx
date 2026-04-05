// src/components/MainLayout.tsx
import React from 'react';
import { useAlbum } from '../context/AlbumContext';
import { WorkflowStep } from '../types';
import UploadStep from './steps/UploadStep';
import ConfigureStep from './steps/ConfigureStep';
import ProcessingStep from './steps/ProcessingStep';
import PreviewStep from './steps/PreviewStep';
import ExportStep from './steps/ExportStep';
import '../styles/MainLayout.css';

const STEPS: { id: WorkflowStep; label: string; icon: string }[] = [
  { id: 'upload',     label: 'Upload',    icon: '↑' },
  { id: 'configure',  label: 'Customise', icon: '✦' },
  { id: 'processing', label: 'Craft',     icon: '◈' },
  { id: 'preview',    label: 'Preview',   icon: '◉' },
  { id: 'export',     label: 'Export',    icon: '⬦' },
];

export default function MainLayout() {
  const { state } = useAlbum();
  const { currentStep } = state;

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="main-layout">
      {/* ── Header ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">✦</span>
            <div>
              <h1 className="brand-name">Mémoire</h1>
              <p className="brand-tagline">AI Photo Album Studio</p>
            </div>
          </div>
          <nav className="step-nav" aria-label="Workflow steps">
            {STEPS.map((step, i) => {
              const isComplete = i < stepIndex;
              const isActive = step.id === currentStep;
              return (
                <div
                  key={step.id}
                  className={`step-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                >
                  <div className="step-icon" aria-hidden>
                    {isComplete ? '✓' : step.icon}
                  </div>
                  <span className="step-label">{step.label}</span>
                  {i < STEPS.length - 1 && <div className="step-connector" />}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="header-line" />
      </header>

      {/* ── Main content ── */}
      <main className="main-content">
        {currentStep === 'upload'     && <UploadStep />}
        {currentStep === 'configure'  && <ConfigureStep />}
        {currentStep === 'processing' && <ProcessingStep />}
        {currentStep === 'preview'    && <PreviewStep />}
        {currentStep === 'export'     && <ExportStep />}
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <p>Mémoire · AI-Powered Photo Albums · Made with care &amp; craft</p>
      </footer>
    </div>
  );
}
