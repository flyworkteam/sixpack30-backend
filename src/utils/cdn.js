/**
 */

const CDN_HOSTNAME = process.env.CDN_HOSTNAME || 'sixpack30.b-cdn.net';

/**
 */
export const getCdnUrl = (path) => {
  if (!path) return null;
  
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `https://${CDN_HOSTNAME}/${cleanPath}`;
};
