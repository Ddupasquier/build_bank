import { ipcMain } from "electron";
import { VendorsRepository } from "../db";

export function registerVendorsIpc() {
  ipcMain.handle("vendors:list", () => VendorsRepository.list());
  ipcMain.handle("vendors:create", (_event, payload) => VendorsRepository.create(payload));
  ipcMain.handle("vendors:update", (_event, id: number, payload) => VendorsRepository.update(id, payload));
  ipcMain.handle("vendors:delete", (_event, id: number) => {
    VendorsRepository.delete(id);
    return { success: true };
  });
}
