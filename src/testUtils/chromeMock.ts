type StorageArea = Record<string, unknown>;

export interface ChromeMockHandles {
  local: StorageArea;
  alarmsCreated: Record<string, chrome.alarms.AlarmCreateInfo>;
  badge: { text: string; color: string };
  notifications: Record<string, chrome.notifications.NotificationOptions<true>>;
}

export function installChromeMock(): ChromeMockHandles {
  const local: StorageArea = {};
  const alarmsCreated: Record<string, chrome.alarms.AlarmCreateInfo> = {};
  const badge = { text: '', color: '' };
  const notifications: Record<string, chrome.notifications.NotificationOptions<true>> = {};

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
        addListener: () => {},
        removeListener: () => {},
      },
    },
    alarms: {
      create: async (name: string, info: chrome.alarms.AlarmCreateInfo) => {
        alarmsCreated[name] = info;
      },
      clear: async (name: string) => {
        delete alarmsCreated[name];
      },
      onAlarm: { addListener: () => {} },
    },
    notifications: {
      create: async (id: string, options: chrome.notifications.NotificationOptions<true>) => {
        notifications[id] = options;
        return id;
      },
      clear: async (id: string) => {
        delete notifications[id];
      },
      onButtonClicked: { addListener: () => {} },
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
      onInstalled: { addListener: () => {} },
    },
  };

  (globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock;

  return { local, alarmsCreated, badge, notifications };
}
