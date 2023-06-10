import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import { readDir, BaseDirectory, FileEntry } from "@tauri-apps/api/fs";
import classNames from "classnames";

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [dir, setDir] = useState<string | null>();
  const [contents, setContents] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    listen("menu-event", e => {
      try {
        if (e.payload === "open-event") {
          setIsOpen(true);
        } else if (e.payload === "new-event") {
          setIsNew(true);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      OnOpen();
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isNew) {
      OnNew();
      setIsNew(false);
    }
  }, [isNew]);

  async function OnOpen() {
    let filepath = await open({directory: true});
    setDir(filepath as string);
  }

  async function OnNew() {
    
  }

  useEffect(() => {
    if (dir) {
      AfterOpen();
    }
  }, [dir]);

  async function AfterOpen() {
    if (dir) {
      let files = await readDir(dir, { dir: BaseDirectory.Home, recursive: false });
      files = files.filter(d => d.name !== ".DS_Store");
      console.log(files);
      setContents(files);
    }
  }

  function getProjectName() {
    if (!dir) return "";
    const dirSplit = dir.split("/");
    return dirSplit[dirSplit.length - 1];
  }

  return (
    <div>
      {dir ? (
        <div className="flex h-full min-h-screen">
          <div className="w-64 bg-gray-100">
            <p className="p-2 break-all border-b text-sm opacity-50">Project: {getProjectName()}</p>
            {contents.map((d) => (
              <button
                className={classNames("p-4 block w-full text-left", selected === d.name ? "bg-white disabled" : "hover:bg-gray-200")}
                key={d.name}
                onClick={() => setSelected(d.name as string)}
              >{d.name}</button>
            ))}
          </div>
        </div>
      ) : (
        <p className="p-4 text-center">No folder open</p>
      )}
    </div>
  );
}