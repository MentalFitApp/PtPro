export const normalizePhotoURLs = (photoURLs) => {
  if (!photoURLs || typeof photoURLs !== 'object') return photoURLs;
  const base = import.meta.env.VITE_R2_PUBLIC_URL || (import.meta.env.VITE_R2_ACCOUNT_ID ? `https://pub-${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.dev` : '');
  const out = {};
  for (const [k, v] of Object.entries(photoURLs)) {
    if (!v) { out[k] = v; continue; }
    if (/^https?:\/\//i.test(v)) {
      out[k] = v; // già completo
    } else {
      out[k] = base ? `${base}/${v}` : v;
    }
  }
  return out;
};

export default normalizePhotoURLs;