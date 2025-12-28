// Landing Page Blocks - Export centralizzato
export { default as HeroBlock } from './HeroBlock';
export { default as FeaturesBlock } from './FeaturesBlock';
export { default as TestimonialsBlock } from './TestimonialsBlock';
export { default as PricingBlock } from './PricingBlock';
export { default as CTABlock } from './CTABlock';
export { default as FormBlock } from './FormBlock';
export { default as FormPopup } from './FormPopup';
export { default as FAQBlock } from './FAQBlock';
export { default as CountdownBlock } from './CountdownBlock';
export { default as SocialProofBlock } from './SocialProofBlock';
export { default as GalleryBlock } from './GalleryBlock';
export { default as VideoBlock } from './VideoBlock';
export { default as TextBlock } from './TextBlock';
export { default as DividerBlock } from './DividerBlock';

// Mappa dei blocchi per rendering dinamico
export const BLOCK_COMPONENTS = {
  hero: () => import('./HeroBlock'),
  features: () => import('./FeaturesBlock'),
  testimonials: () => import('./TestimonialsBlock'),
  pricing: () => import('./PricingBlock'),
  cta: () => import('./CTABlock'),
  form: () => import('./FormBlock'),
  faq: () => import('./FAQBlock'),
  countdown: () => import('./CountdownBlock'),
  socialProof: () => import('./SocialProofBlock'),
  gallery: () => import('./GalleryBlock'),
  video: () => import('./VideoBlock'),
  text: () => import('./TextBlock'),
  divider: () => import('./DividerBlock'),
};

// Componente per rendering dinamico dei blocchi
import React, { Suspense, lazy } from 'react';

const blockCache = {};

export const DynamicBlock = ({ type, settings, isPreview, pageId, tenantId }) => {
  if (!type || !BLOCK_COMPONENTS[type]) {
    console.error('❌ Blocco non riconosciuto:', type);
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl">
        Blocco non riconosciuto: {type || '(tipo mancante)'}
      </div>
    );
  }

  // Lazy load con cache
  if (!blockCache[type]) {
    blockCache[type] = lazy(BLOCK_COMPONENTS[type]);
  }

  const BlockComponent = blockCache[type];

  return (
    <Suspense fallback={
      <div className="animate-pulse bg-slate-800/50 rounded-xl h-40 flex items-center justify-center">
        <span className="text-slate-500">Caricamento blocco...</span>
      </div>
    }>
      <BlockComponent 
        settings={settings} 
        isPreview={isPreview} 
        pageId={pageId}
        tenantId={tenantId}
      />
    </Suspense>
  );
};

export default {
  HeroBlock: lazy(() => import('./HeroBlock')),
  FeaturesBlock: lazy(() => import('./FeaturesBlock')),
  TestimonialsBlock: lazy(() => import('./TestimonialsBlock')),
  PricingBlock: lazy(() => import('./PricingBlock')),
  CTABlock: lazy(() => import('./CTABlock')),
  FormBlock: lazy(() => import('./FormBlock')),
  FAQBlock: lazy(() => import('./FAQBlock')),
  CountdownBlock: lazy(() => import('./CountdownBlock')),
  SocialProofBlock: lazy(() => import('./SocialProofBlock')),
  GalleryBlock: lazy(() => import('./GalleryBlock')),
  VideoBlock: lazy(() => import('./VideoBlock')),
  TextBlock: lazy(() => import('./TextBlock')),
  DividerBlock: lazy(() => import('./DividerBlock')),
};
