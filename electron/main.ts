import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import log from "electron-log";
import { initDb } from "./db";
import { registerMaterialsIpc } from "./ipcHandlers/materials";
import { registerVendorsIpc } from "./ipcHandlers/vendors";

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  initDb();
  registerMaterialsIpc();
  registerVendorsIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("log", (_event, message) => {
  log.info(message);
});
