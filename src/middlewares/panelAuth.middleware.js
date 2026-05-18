import { panelConfig } from '../panel/config.js';
import { panelError } from '../panel/utils.js';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

function extractPanelKey(req) {
  const headerKey =
    req.headers['x-panel-api-key'] ||
    req.headers['x-panel-key'];
  if (headerKey) return headerKey;

  const auth = req.headers.authorization;
  if (auth && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, '').trim();
  }
  return null;
}

export function panelAuth(req, res, next) {
  if (!panelConfig.enabled) {
    return panelError(res, 404, 'NOT_FOUND', 'Panel API devre dışı.');
  }

  if (!panelConfig.apiKey) {
    return panelError(res, 503, 'NOT_CONFIGURED', 'PANEL_API_KEY tanımlı değil.');
  }

  if (panelConfig.allowedIps.length > 0) {
    const clientIp = getClientIp(req);
    if (!panelConfig.allowedIps.includes(clientIp)) {
      return panelError(res, 403, 'FORBIDDEN', 'IP adresi izin listesinde değil.');
    }
  }

  const provided = extractPanelKey(req);
  if (!provided || provided !== panelConfig.apiKey) {
    return panelError(res, 403, 'FORBIDDEN', 'Geçersiz panel API anahtarı.');
  }

  next();
}
