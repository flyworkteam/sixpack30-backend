/**
 * CDN URL'lerini yöneten yardımcı fonksiyonlar.
 */

const CDN_HOSTNAME = process.env.CDN_HOSTNAME || 'sixpack30.b-cdn.net';

/**
 * Verilen göreli yolu tam bir CDN URL'ine dönüştürür.
 * @param path Resmin göreli yolu (örn: 'exercises/pushup.png')
 * @returns Tam URL (örn: 'https://sixpack30.b-cdn.net/exercises/pushup.png')
 */
export const getCdnUrl = (path?: string | null): string | null => {
  if (!path) return null;
  
  // Eğer zaten bir URL ise (http ile başlıyorsa) dokunma
  if (path.startsWith('http')) return path;
  
  // Başındaki/sonundaki slash'ları temizleyelim
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `https://${CDN_HOSTNAME}/${cleanPath}`;
};
