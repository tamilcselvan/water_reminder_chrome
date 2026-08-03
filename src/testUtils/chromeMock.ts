type StorageArea = Record<string, unknown>;

type StorageOnChangedListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;
type AlarmOnAlarmListener = (alarm: chrome.alarms.Alarm) => void;
type NotificationButtonClickedListener = (notificationId: string, buttonIndex: number) => void;
type VoidListener = () => void;

export interface ChromeMockHandles {
  local: StorageArea;
  alarmsCreated: Record<string, chrome.alarms.AlarmCreateInfo>;
  badge: { text: string; color: string };
  notifications: Record<string, chrome.notifications.NotificationOptions>;
  /**
   * Fires the registered listeners for each mocked chrome.* event, so tests can simulate
   * "chrome fires this event" and assert on the resulting side effects (e.g. the seam
   * between chrome.storage.onChanged firing and the background worker reacting to it).
   */
  fire: {
    storageOnChanged: (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName?: string,
    ) => void;
    alarmsOnAlarm: (alarm: chrome.alarms.Alarm) => void;
    notificationsOnButtonClicked: (notificationId: string, buttonIndex: number) => void;
    runtimeOnInstalled: () => void;
    runtimeOnStartup: () => void;
  };
}

export function installChromeMock(): ChromeMockHandles {
  const local: StorageArea = {};
  const alarmsCreated: Record<string, chrome.alarms.AlarmCreateInfo> = {};
  const badge = { text: '', color: '' };
  const notifications: Record<string, chrome.notifications.NotificationOptions> = {};

  const storageOnChangedListeners: StorageOnChangedListener[] = [];
  const alarmsOnAlarmListeners: AlarmOnAlarmListener[] = [];
  const notificationsOnButtonClickedListeners: NotificationButtonClickedListener[] = [];
  const runtimeOnInstalledListeners: VoidListener[] = [];
  const runtimeOnStartupListeners: VoidListener[] = [];

  const chromeMock = {
    storage: {
      local: {
        get: async (keys?: string | string[] | null) => {
          if (!keys) return { ...local };
          const keyList = Array.isArray(keys) ? keys : [keys];
          const result: StorageArea = {};
          for (const k of keyList) if (k in local) result[k] = local[k];
          return result;
        },
        set: async (items: StorageArea) => {
          Object.assign(local, items);
        },
        clear: async () => {
          for (const k of Object.keys(local)) delete local[k];
        },
      },
      onChanged: {
        addListener: (listener: StorageOnChangedListener) => {
          storageOnChangedListeners.push(listener);
        },
        removeListener: (listener: StorageOnChangedListener) => {
          const i = storageOnChangedListeners.indexOf(listener);
          if (i !== -1) storageOnChangedListeners.splice(i, 1);
        },
      },
    },
    alarms: {
      create: async (name: string, info: chrome.alarms.AlarmCreateInfo) => {
        alarmsCreated[name] = info;
      },
      clear: async (name: string) => {
        delete alarmsCreated[name];
      },
      onAlarm: {
        addListener: (listener: AlarmOnAlarmListener) => {
          alarmsOnAlarmListeners.push(listener);
        },
        removeListener: (listener: AlarmOnAlarmListener) => {
          const i = alarmsOnAlarmListeners.indexOf(listener);
          if (i !== -1) alarmsOnAlarmListeners.splice(i, 1);
        },
      },
    },
    notifications: {
      create: async (id: string, options: chrome.notifications.NotificationOptions) => {
        notifications[id] = options;
        return id;
      },
      clear: async (id: string) => {
        delete notifications[id];
      },
      onButtonClicked: {
        addListener: (listener: NotificationButtonClickedListener) => {
          notificationsOnButtonClickedListeners.push(listener);
        },
        removeListener: (listener: NotificationButtonClickedListener) => {
          const i = notificationsOnButtonClickedListeners.indexOf(listener);
          if (i !== -1) notificationsOnButtonClickedListeners.splice(i, 1);
        },
      },
    },
    action: {
      setBadgeText: async (details: { text: string }) => {
        badge.text = details.text;
      },
      setBadgeBackgroundColor: async (details: { color: string }) => {
        badge.color = details.color;
      },
    },
    runtime: {
      onInstalled: {
        addListener: (listener: VoidListener) => {
          runtimeOnInstalledListeners.push(listener);
        },
      },
      onStartup: {
        addListener: (listener: VoidListener) => {
          runtimeOnStartupListeners.push(listener);
        },
      },
    },
  };

  (globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock;

  return {
    local,
    alarmsCreated,
    badge,
    notifications,
    fire: {
      storageOnChanged: (changes, areaName = 'local') => {
        for (const listener of [...storageOnChangedListeners]) listener(changes, areaName);
      },
      alarmsOnAlarm: (alarm) => {
        for (const listener of [...alarmsOnAlarmListeners]) listener(alarm);
      },
      notificationsOnButtonClicked: (notificationId, buttonIndex) => {
        for (const listener of [...notificationsOnButtonClickedListeners]) {
          listener(notificationId, buttonIndex);
        }
      },
      runtimeOnInstalled: () => {
        for (const listener of [...runtimeOnInstalledListeners]) listener();
      },
      runtimeOnStartup: () => {
        for (const listener of [...runtimeOnStartupListeners]) listener();
      },
    },
  };
}
