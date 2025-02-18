// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  clipboard,
  ipcMain,
  Tray,
  Menu,
  shell
} = require("electron")
const ShortUniqueId = require('short-unique-id')
const { randomUUID } = new ShortUniqueId({ length: 10 })
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const path = require('node:path')
const jsonFile = path.join(app.getPath("userData"), "/.urboard.json")
const adapter = new FileSync(jsonFile)
const db = low(adapter)

db.defaults({ clipboard: [] }).write()

function createWindow() {
  let appShow = true

  const mainWindow = new BrowserWindow({
    title: "UR Board",
    frame: false,
    x: screen.getPrimaryDisplay().bounds.width,
    y: 100,
    minWidth: 340,
    width: 340,
    height: screen.getPrimaryDisplay().workAreaSize.height - 100,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    show: true,
    autoHideMenuBar: true,
    kiosk: false,
    skipTaskbar: false,
    icon: path.join(__dirname, "assets/logo/logo.ico"),
    resizable: true,
    alwaysOnTop: true,
    darkTheme: true,
    images: true,
    skipTaskbar: true,
  })

  mainWindow.loadFile("index.html", { query: { "path": jsonFile } })

  globalShortcut.register("Alt+Shift+X", () => {
    appShow = !appShow
    appShow ? mainWindow.show() : mainWindow.hide()
  })

  ipcMain.on("hide-window", () => {
    appShow = !appShow
    mainWindow.hide()
  })

  // Override the close action to hide window.
  // mainWindow.on("close", e => {
  //   if (appShow) {
  //     e.preventDefault()
  //     appShow = false
  //     mainWindow.hide()
  //   }
  // })

  // Open URLs externally.
  var handleRedirect = (e, url) => {
    if (url != mainWindow.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }
  mainWindow.webContents.on('will-navigate', handleRedirect)
  mainWindow.webContents.on('new-window', handleRedirect)

  // Check system clipboard.
  startMonitoringClipboard()

  function startMonitoringClipboard() {
    mainWindow.webContents.send("app-running")
    let previousText = clipboard.readText()

    const isDiffText = (str1, str2) => {
      return str2 && str1 !== str2
    }

    setInterval(() => {
      const currentText = clipboard.readText()
      if (isDiffText(previousText, currentText) && !isDuplicateValue(currentText)) {
        writeTextClipboard(currentText)
      }

      previousText = currentText
    }, 500)
  }

  function isDuplicateValue(text) {
    const adapter = new FileSync(jsonFile)
    const db = low(adapter)
    const clipboardItems = db.get("clipboard").value()
    const trimmedText = text.trim()
    return clipboardItems.some(item => item.text === trimmedText)
  }

  function writeTextClipboard(text) {
    const trimmedText = text.trim()
    const id = randomUUID()
    const adapter = new FileSync(jsonFile)
    const db = low(adapter)
    db.get("clipboard")
      .push({ id, text: trimmedText })
      .write()

    updateClipboardList()
  }

  function updateClipboardList() {
    mainWindow.webContents.send("update-clipboard")
  }

  const isMac = process.platform === 'darwin'
  const template = [
    // { role: 'appMenu' }
    // { type: 'separator' },
    ...(isMac
      ? [{
        label: "Clipboard",
        submenu: [
          { role: 'about' },
          { role: 'services' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { role: 'quit' }
        ]
      }]
      : [
        {
          label: "Clipboard",
          submenu: [{
            label: "Open UR Board",
            accelerator: 'Alt+Shift+X',
            click: () => {
              if (!appShow) {
                appShow = true
                mainWindow.show()
              }
            }
          },
          isMac ? { role: 'close' } : { role: 'quit' }
          ]
        }
      ]),
    // { role: 'fileMenu' },
    // { role: 'editMenu' },
    // { role: 'viewMenu' },

    // Open the DevTools.
    // NOTICE: Only For Development Mode.
    // { role: 'toggleDevTools' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'shareMenu' },
    // { role: 'windowMenu' },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        {
          label: 'Maximize',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+M' : 'Ctrl+Shift+M',
          click: () => {
            mainWindow.maximize()
          }
        },
        ...(isMac
          ? [
            { role: 'front' },
            { role: 'window' }
          ]
          : [
            {
              label: 'Show',
              accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
              click: () => {
                mainWindow.show()
              }
            },
            {
              label: 'Hide',
              accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Ctrl+W',
              click: () => {
                mainWindow.hide()
              }
            },
          ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            await shell.openExternal('https://github.com/vinugawade/urboard')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  tray = new Tray(path.join(__dirname, "assets/logo/logo(16x20).png"))
  tray.setToolTip("UR Clipboard")
  tray.setContextMenu(menu)

  // Open the DevTools.
  // NOTICE: Only For Development Mode.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') app.quit()
  if (process.platform === 'darwin') app.dock.hide()
  app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
