const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
  tray = new Tray(path.join(__dirname, '../public/favicon.svg')); // Using mock icon
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Buka DyaTask Manager', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: 'Uji Alarm / Alert', click: () => {
        if (mainWindow) mainWindow.webContents.send('trigger-alert-demo');
      } 
    },
    { type: 'separator' },
    { label: 'Keluar', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('DyaTask Manager');
  tray.setContextMenu(contextMenu);

  // Default autostart enabled
  setupMacAutostart(true);

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
