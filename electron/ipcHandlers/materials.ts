import { ipcMain } from "electron";
import { MaterialsRepository, LinksRepository, getLatestPricesForMaterial } from "../db";

export function registerMaterialsIpc() {
  ipcMain.handle("materials:list", () => {
    return MaterialsRepository.list();
  });

  ipcMain.handle("materials:create", (_event, payload) => {
    return MaterialsRepository.create(payload);
  });

  ipcMain.handle("materials:update", (_event, id: number, payload) => {
    return MaterialsRepository.update(id, payload);
  });

  ipcMain.handle("materials:delete", (_event, id: number) => {
    MaterialsRepository.delete(id);
    return { success: true };
  });

  ipcMain.handle("materials:latestPrices", (_event, materialId: number) => {
    return getLatestPricesForMaterial(materialId);
  });

  ipcMain.handle("materials:links:list", (_event, materialId: number) => {
    return LinksRepository.listForMaterial(materialId);
  });

  ipcMain.handle("materials:links:create", (_event, payload) => {
    return LinksRepository.create(payload);
  });

  ipcMain.handle("materials:links:delete", (_event, id: number) => {
    LinksRepository.delete(id);
    return { success: true };
  });
}
