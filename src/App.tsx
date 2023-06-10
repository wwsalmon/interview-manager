import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import { readDir, BaseDirectory, FileEntry } from "@tauri-apps/api/fs";
import classNames from "classnames";
import Modal from "react-modal";

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [isNewModal, setIsNewModal] = useState<boolean>(false);
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
    setIsNewModal(true);
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
          <Modal
            isOpen={isNewModal}
            onRequestClose={() => setIsNewModal(false)}
            style={{
              overlay: {
                backgroundColor: "rgba(0,0,0,0.5)",
              },
              content: {
                maxWidth: "400px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                height: "320px",
              }
            }}
          >
            <p className="text-center mb-6 font-bold">New file</p>
            <p className="uppercase mb-2 text-sm tracking-wide font-bold">Name</p>
            <input type="text" className="border w-full p-2 mb-6" placeholder="Tim interview"/>
            <p className="uppercase mb-2 text-sm tracking-wide font-bold">Date</p>
            <input type="date" className="border w-full p-2 mb-6"/>
            <button className="w-full bg-gray-800 p-2 text-white mt-auto">Create</button>
          </Modal>
        </div>
      ) : (
        <p className="p-4 text-center">No folder open</p>
      )}
    </div>
  );
}