import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import log from "electron-log";
import { initDb } from "./db";
import { registerMaterialsIpc } from "./ipcHandlers/materials";
import { registerVendorsIpc } from "./ipcHandlers/vendors";
import { registerScrapingIpc } from "./ipcHandlers/scraping";

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

  const rendererPath = path.join(__dirname, "..", "..", "dist", "index.html");
  win.loadFile(rendererPath);
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  initDb();
  registerMaterialsIpc();
  registerVendorsIpc();
  registerScrapingIpc();
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
