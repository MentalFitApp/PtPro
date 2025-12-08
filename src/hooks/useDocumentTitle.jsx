// src/hooks/useDocumentTitle.jsx
// Hook per gestire titolo pagina e meta tags SEO

import { useEffect, useRef } from 'react';

const DEFAULT_TITLE = 'FlowFitPro';
const DEFAULT_DESCRIPTION = 'La piattaforma completa per Personal Trainer e Coach';

/**
 * Hook per aggiornare il titolo della pagina
 * 
 * @param title - Titolo della pagina
 * @param options - Opzioni aggiuntive
 */
export function useDocumentTitle(title, options = {}) {
  const {
    suffix = DEFAULT_TITLE,
    separator = ' | ',
    restoreOnUnmount = true
  } = options;

  const previousTitle = useRef(document.title);

  useEffect(() => {
    if (title) {
      document.title = suffix ? `${title}${separator}${suffix}` : title;
    } else {
      document.title = suffix || DEFAULT_TITLE;
    }

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle.current;
      }
    };
  }, [title, suffix, separator, restoreOnUnmount]);
}

/**
 * Hook per aggiornare i meta tags
 */
export function useMetaTags(meta = {}) {
  useEffect(() => {
    const {
      title,
      description,
      keywords,
      author,
      ogTitle,
      ogDescription,
      ogImage,
      ogUrl,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      robots
    } = meta;

    const setMetaTag = (name, content, property = false) => {
      if (!content) return;
      
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Meta standard
    if (description) setMetaTag('description', description);
    if (keywords) setMetaTag('keywords', keywords);
    if (author) setMetaTag('author', author);
    if (robots) setMetaTag('robots', robots);

    // Open Graph
    if (ogTitle || title) setMetaTag('og:title', ogTitle || title, true);
    if (ogDescription || description) setMetaTag('og:description', ogDescription || description, true);
    if (ogImage) setMetaTag('og:image', ogImage, true);
    if (ogUrl) setMetaTag('og:url', ogUrl, true);
    setMetaTag('og:type', 'website', true);

    // Twitter Card
    setMetaTag('twitter:card', twitterCard || 'summary_large_image');
    if (twitterTitle || title) setMetaTag('twitter:title', twitterTitle || title);
    if (twitterDescription || description) setMetaTag('twitter:description', twitterDescription || description);
    if (twitterImage || ogImage) setMetaTag('twitter:image', twitterImage || ogImage);

  }, [meta]);
}

/**
 * Hook combinato per SEO completo
 */
export function useSEO({ title, description, ...rest }) {
  useDocumentTitle(title);
  useMetaTags({ title, description, ...rest });
}

/**
 * Componente per SEO (alternativa ai hooks)
 */
export function SEO({ 
  title, 
  description = DEFAULT_DESCRIPTION,
  keywords,
  image,
  url,
  noindex = false
}) {
  useDocumentTitle(title);
  useMetaTags({
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogUrl: url,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    robots: noindex ? 'noindex, nofollow' : 'index, follow'
  });

  return null; // Componente invisibile
}

export default useDocumentTitle;
