import { readDir, createDir, BaseDirectory, exists } from "@tauri-apps/api/fs";
import { message } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";

export default function App() {
  const [folders, setFolders] = useState<any[] | null>(null);

  useEffect(() => {
    async function onLoad() {
      const hasAppFolder = await exists("szh-interviews", { dir: BaseDirectory.Desktop });

      if (!hasAppFolder) {
        await createDir("szh-interviews", { dir: BaseDirectory.Desktop });
        setFolders([]);
      } else {
        const folders = await readDir("szh-interviews", { dir: BaseDirectory.Desktop, recursive: true });
        setFolders(folders);
      }
    }

    onLoad();
  }, []);

  console.log(folders);

  return (
    <div>
      <p className="p-4 text-center bg-gray-100">hello world</p>
    </div>
  );
}