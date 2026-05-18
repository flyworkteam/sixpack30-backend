import { PANEL_CONTRACT_VERSION, panelConfig } from '../../panel/config.js';

export const getPanelHealth = (req, res) => {
  res.status(200).json({
    ok: true,
    service: panelConfig.serviceName,
    contractVersion: PANEL_CONTRACT_VERSION,
  });
};
