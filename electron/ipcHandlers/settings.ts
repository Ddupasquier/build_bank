import { ipcMain } from "electron";
import { SettingsRepository } from "../db";

export function registerSettingsIpc() {
  ipcMain.handle("settings:set", (_event, key: string, value: string) => {
    SettingsRepository.set(key, value);
    return { success: true };
  });

  ipcMain.handle("settings:get", (_event, key: string) => {
    return SettingsRepository.get(key)?.value ?? null;
  });

  ipcMain.handle("settings:lastPriceUpdate", () => {
    return SettingsRepository.getLastPriceUpdate();
  });
}
