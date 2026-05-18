export const PANEL_CONTRACT_VERSION = '2';

export const panelConfig = {
  enabled: process.env.PANEL_API_ENABLED !== 'false',
  apiKey: process.env.PANEL_API_KEY || '',
  timezone: process.env.PANEL_TIMEZONE || 'Europe/Istanbul',
  dailyDays: Math.min(
    90,
    Math.max(7, parseInt(process.env.PANEL_DAILY_DAYS || '30', 10) || 30)
  ),
  defaultLimit: 20,
  maxLimit: 100,
  allowedIps: (process.env.PANEL_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
  serviceName: process.env.PANEL_SERVICE_NAME || 'sixpack30-api',
};
