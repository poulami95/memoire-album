// src/components/steps/ProcessingStep.tsx
import React, { useEffect } from 'react';
import { useAlbum } from '../../context/AlbumContext';
import { analyzeImages, generateAlbumPlan } from '../../utils/aiService';
import toast from 'react-hot-toast';
import '../../styles/ProcessingStep.css';

const PROCESSING_STAGES = [
  { label: 'Reviewing your photos', detail: 'AI is evaluating quality & relevance…', icon: '◈' },
  { label: 'Curating the best shots', detail: 'Selecting the finest moments from your collection…', icon: '✦' },
  { label: 'Designing page layouts', detail: 'Crafting compositions for each spread…', icon: '◉' },
  { label: 'Writing captions', detail: 'Penning poetic words for your story…', icon: '✍' },
  { label: 'Assembling your album', detail: 'Bringing it all together…', icon: '⬦' },
];

export default function ProcessingStep() {
  const { state, setStep, setProcessing, setProgress, setPages, dispatch } = useAlbum();
  const { project, processingProgress, processingStatus } = state;

  useEffect(() => {
    let cancelled = false;

    async function runProcessing() {
      setProcessing(true);
      setProgress(0, '');
      try {
        // Stage 1: Analyze images
        if (cancelled) return;
        setProgress(5, PROCESSING_STAGES[0].label);
        const analyzedImages = await analyzeImages(
          project.images.filter(i => i.selected),
          project.config,
          (i, total) => {
            if (cancelled) return;
            const pct = Math.round(5 + (i / total) * 40);
            setProgress(pct, `Analysing photo ${i + 1} of ${total}…`);
          }
        );

        if (cancelled) return;

        // Update images in state with AI scores
        dispatch({ type: 'ADD_IMAGES', payload: [] });
        analyzedImages.forEach(img => dispatch({ type: 'UPDATE_IMAGE', payload: img }));

        // Stage 2: Curate
        setProgress(50, PROCESSING_STAGES[1].label);
        await delay(600);
        if (cancelled) return;

        // Stage 3: Generate album plan
        setProgress(60, PROCESSING_STAGES[2].label);
        const pages = await generateAlbumPlan(analyzedImages, project.config);
        if (cancelled) return;

        // Stage 4: Captions
        setProgress(85, PROCESSING_STAGES[3].label);
        await delay(500);
        if (cancelled) return;

        // Stage 5: Assemble
        setProgress(95, PROCESSING_STAGES[4].label);
        await delay(400);
        if (cancelled) return;

        setPages(pages);
        setProgress(100, 'Your album is ready!');
        await delay(600);
        if (cancelled) return;

        toast.success('Album crafted successfully ✦');
        setStep('preview');
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        toast.error('Something went wrong: ' + (err?.message || 'Unknown error'));
        setStep('configure');
      } finally {
        if (!cancelled) setProcessing(false);
      }
    }

    runProcessing();

    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, []);

  const stageIndex = Math.min(
    Math.floor((processingProgress / 100) * PROCESSING_STAGES.length),
    PROCESSING_STAGES.length - 1
  );
  const stage = PROCESSING_STAGES[stageIndex];

  return (
    <div className="processing-step animate-fade-up">
      <div className="processing-card">
        {/* Animated orb */}
        <div className="processing-orb">
          <div className="orb-outer" />
          <div className="orb-middle" />
          <div className="orb-inner">
            <span className="orb-icon animate-pulse-soft">{stage?.icon || '◈'}</span>
          </div>
        </div>

        <div className="processing-content">
          <p className="processing-eyebrow">Crafting your album</p>
          <h2 className="processing-title">{stage?.label || 'Processing…'}</h2>
          <p className="processing-detail">{processingStatus || stage?.detail}</p>

          {/* Progress bar */}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${processingProgress}%` }}
            />
            <div
              className="progress-glow"
              style={{ left: `${processingProgress}%` }}
            />
          </div>
          <p className="progress-pct">{processingProgress}%</p>

          {/* Stage indicators */}
          <div className="stage-dots">
            {PROCESSING_STAGES.map((s, i) => (
              <div
                key={i}
                className={`stage-dot ${i < stageIndex ? 'complete' : ''} ${i === stageIndex ? 'active' : ''}`}
                title={s.label}
              />
            ))}
          </div>

          <p className="processing-note">
            This may take 30–60 seconds depending on the number of photos.
          </p>
        </div>
      </div>

      {/* Background ambience */}
      <div className="processing-bg">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-particle" style={{
            '--delay': `${i * 0.7}s`,
            '--x': `${Math.random() * 100}%`,
            '--size': `${4 + Math.random() * 8}px`,
          } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
