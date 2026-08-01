import { api } from './api';

export interface NotificationPreferenceUI {
  eventType: string;
  isInAppEnabled: boolean;
  isEmailEnabled: boolean;
}

const mapPref = (p: any): NotificationPreferenceUI => ({
  eventType: p.event_type || p.eventType,
  isInAppEnabled: p.is_in_app_enabled || p.isInAppEnabled || false,
  isEmailEnabled: p.is_email_enabled || p.isEmailEnabled || false,
});

export const getNotificationPreferences = async (): Promise<NotificationPreferenceUI[]> => {
  const res = await api.get('/user/notification-preferences');
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapPref);
};

export const updateNotificationPreferences = async (preferences: NotificationPreferenceUI[]): Promise<void> => {
  const payload = preferences.map((p) => ({
    event_type: p.eventType,
    is_in_app_enabled: p.isInAppEnabled,
    is_email_enabled: p.isEmailEnabled,
  }));
  await api.put('/user/notification-preferences', { preferences: payload });
};
