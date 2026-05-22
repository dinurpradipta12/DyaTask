const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
const APP_NAME = 'Dyatask Manager - Superapp for Freelancer';

function getTrayIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'minilogo-dyatask.png');
  }

  return path.join(__dirname, '../src/minilogo-dyatask.png');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: APP_NAME,
    titleBarStyle: 'hiddenInset', // Mac style title bar
    backgroundColor: '#09070F', // Amethyst dark theme matching background
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // simplified for mock interaction
    },
  });

  // Load URL depending on dev/production mode
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update DyaTask tersedia',
      message: `Versi ${info.version} tersedia.`,
      detail: 'Download update sekarang? App akan meminta restart setelah download selesai.',
      buttons: ['Download', 'Nanti'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update siap diinstal',
      message: `DyaTask ${info.version} sudah selesai diunduh.`,
      detail: 'Restart app sekarang untuk memasang update.',
      buttons: ['Restart & Install', 'Nanti'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto update error:', error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(error => {
      console.error('Update check failed:', error);
    });
  }, 6000);
}

// Function to handle macOS autostart via LaunchAgent plist programmatically
function setupMacAutostart(enable) {
  const homeDir = app.getPath('home');
  const plistPath = path.join(homeDir, 'Library/LaunchAgents/com.dyatask.manager.plist');
  
  if (enable) {
    const appPath = app.getPath('exe');
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dyatask.manager</string>
    <key>ProgramArguments</key>
    <array>
        <string>${appPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>`;
    try {
      // Ensure Library/LaunchAgents directory exists
      const dir = path.dirname(plistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(plistPath, plistContent);
      console.log('macOS autostart plist created successfully.');
    } catch (err) {
      console.error('Error creating macOS autostart plist:', err);
    }
  } else {
    try {
      if (fs.existsSync(plistPath)) {
        fs.unlinkSync(plistPath);
        console.log('macOS autostart plist removed successfully.');
      }
    } catch (err) {
      console.error('Error removing macOS autostart plist:', err);
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut (Option + Space) to toggle floating input overlay
  globalShortcut.register('Option+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.webContents.send('toggle-floating-quick-add');
      } else {
        mainWindow.show();
        mainWindow.webContents.send('toggle-floating-quick-add');
      }
    }
  });

  // Setup System Tray
  tray = new Tray(getTrayIconPath());
  const contextMenu = Menu.buildFromTemplate([
    { label: `Buka ${APP_NAME}`, click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: 'Uji Alarm / Alert', click: () => {
        if (mainWindow) mainWindow.webContents.send('trigger-alert-demo');
      } 
    },
    { type: 'separator' },
    { label: 'Keluar', click: () => { app.quit(); } }
  ]);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  // Default autostart enabled
  setupMacAutostart(true);
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC communication channel
ipcMain.on('set-autostart', (event, enable) => {
  setupMacAutostart(enable);
  event.reply('autostart-status', enable);
});
