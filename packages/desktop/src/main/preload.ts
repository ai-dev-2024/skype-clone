import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Notification
  showNotification: (options: { title: string; body: string; icon?: string }) =>
    ipcRenderer.send('show-notification', options),

  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (defaultPath: string, filters?: any[]) =>
    ipcRenderer.invoke('save-file', defaultPath, filters),

  // App events
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },

  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },

  onMenuNewChat: (callback: () => void) => {
    ipcRenderer.on('menu-new-chat', callback);
    return () => ipcRenderer.removeListener('menu-new-chat', callback);
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<void>;
      storeDelete: (key: string) => Promise<void>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      showNotification: (options: { title: string; body: string; icon?: string }) => void;
      selectFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      saveFile: (defaultPath: string, filters?: any[]) => Promise<{ canceled: boolean; filePath?: string }>;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      onMenuNewChat: (callback: () => void) => () => void;
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}
