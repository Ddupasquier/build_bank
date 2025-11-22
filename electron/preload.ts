import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, listener: (...args: unknown[]) => void) =>
    ipcRenderer.on(channel, (_event, ...data) => listener(...data))
});

export type ElectronAPI = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
