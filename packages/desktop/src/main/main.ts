import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Store for persistent data
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Create main window
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create system tray
function createTray(): void {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, 'assets/tray-icon.png')
  ).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Skype Clone',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Skype Clone');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-chat');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Skype Clone',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About Skype Clone',
              message: 'Skype Clone',
              detail: `Version ${app.getVersion()}\nA full-featured communication platform`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
function setupIpcHandlers(): void {
  // Store operations
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
  });

  // Window operations
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow?.close();
  });

  // Notification
  ipcMain.on('show-notification', (event, { title, body, icon }) => {
    const notification = new Notification({
      title,
      body,
      icon: icon ? path.join(__dirname, icon) : undefined,
    });

    notification.show();

    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
  });

  // File operations
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
        { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return result;
  });

  ipcMain.handle('save-file', async (event, defaultPath, filters) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    return result;
  });
}

// Auto-updater
function setupAutoUpdater(): void {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    log.info('Update available');
    mainWindow?.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    mainWindow?.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
  });
}

// App event handlers
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  createMenu();
  setupIpcHandlers();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Handle app being opened from system tray
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
