/**
 * OneSignal Push Notification Service
 *
 * Bu servis, OneSignal REST API üzerinden push bildirimi göndermek için
 * kullanılan merkezi ve yeniden kullanılabilir fonksiyonları içerir.
 *
 * Kullanım:
 *   import { sendToUser, sendToAll } from '../services/onesignal.service';
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

interface NotificationPayload {
  app_id: string;
  headings: { en: string; tr: string };
  contents: { en: string; tr: string };
  include_aliases?: { external_id: string[] };
  include_subscribed_segments?: string[];
  target_channel: string;
}

/**
 * Belirli bir kullanıcıya push bildirimi gönderir.
 *
 * @param firebaseUid - Kullanıcının Firebase UID'si (OneSignal External User ID olarak set edilmiş olmalı)
 * @param title - Bildirim başlığı
 * @param body - Bildirim içeriği
 */
export const sendToUser = async (
  firebaseUid: string,
  title: string,
  body: string
): Promise<void> => {
  const payload: NotificationPayload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    headings: { en: title, tr: title },
    contents: { en: body, tr: body },
    include_aliases: {
      external_id: [firebaseUid],
    },
  };

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] Bildirim gönderilemedi:', data);
      return;
    }

    console.log(`[OneSignal] Kullanıcıya bildirim gönderildi (uid: ${firebaseUid}):`, data.id);
  } catch (error) {
    console.error('[OneSignal] API isteği başarısız:', error);
  }
};

/**
 * Tüm abone kullanıcılara toplu push bildirimi gönderir.
 *
 * @param title - Bildirim başlığı
 * @param body - Bildirim içeriği
 */
export const sendToAll = async (title: string, body: string): Promise<void> => {
  const payload: NotificationPayload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    headings: { en: title, tr: title },
    contents: { en: body, tr: body },
    include_subscribed_segments: ['Total Subscriptions'],
  };

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] Toplu bildirim gönderilemedi:', data);
      return;
    }

    console.log('[OneSignal] Tüm kullanıcılara bildirim gönderildi. ID:', data.id);
  } catch (error) {
    console.error('[OneSignal] API isteği başarısız:', error);
  }
};
