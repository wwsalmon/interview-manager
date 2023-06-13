import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, FileEntry, readDir, writeTextFile } from "@tauri-apps/api/fs";
import classNames from "classnames";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import Interview from "./components/Interview";
import makeFile from "./utils/makeFile";

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenLoading, setIsOpenLoading] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [isNewModal, setIsNewModal] = useState<boolean>(false);
  const [dir, setDir] = useState<string | null>(null);
  const [contents, setContents] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  
  const [newName, setNewName] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");

  const [newUrl, setNewUrl] = useState<string>("");

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
  }, [dir]);

  useEffect(() => {
    if (isOpen) {
      onOpen();
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isNew) {
      onNew();
      setIsNew(false);
    }
  }, [isNew]);

  async function onOpen() {
    if (isOpenLoading) return;

    setIsOpenLoading(true);

    let filepath = await open({directory: true});
    setDir(filepath as string);
    setSelected(null);
    setIsOpenLoading(false);
  }

  async function onNew() {
    setIsNewModal(true);
  }

  useEffect(() => {
    if (dir) {
      afterOpen();
    }
  }, [dir]);

  async function afterOpen() {
    if (dir) {
      let files = await readDir(dir, { dir: BaseDirectory.Home, recursive: false });
      files = files.filter(d => d.name?.substring(d.name.length - 10) === ".interview");
      setContents(files);
    }
  }

  function getProjectName() {
    if (!dir) return "";
    const dirSplit = dir.split("/");
    return dirSplit[dirSplit.length - 1];
  }

  async function onCreate() {
    const fileContent = makeFile(newName, newDate, "", "");

    const fileName = encodeURIComponent(newName) + ".interview";

    await writeTextFile(dir + "/" + fileName, fileContent, {dir: BaseDirectory.Home});

    await afterOpen();

    setSelected(fileName);
    setNewName("");
    setNewDate("");
    setIsNewModal(false);
  }

  return (
    <div>
      {dir ? (
        <div className="flex h-full min-h-screen">
          <div className="w-64 bg-gray-100 flex-shrink-0">
            <p className="p-2 break-all border-b text-sm opacity-50">Project: {getProjectName()}</p>
            {contents.map((d) => (
              <button
                className={classNames("p-4 block w-full text-left", selected === d.name ? "bg-white disabled border-t border-b" : "hover:bg-gray-200")}
                key={d.name}
                onClick={() => setSelected(d.name as string)}
              >{d.name}</button>
            ))}
            {!contents.length && (
              <p className="text-sm p-2">No files yet, press Ctrl + N to create a new one, or Ctrl + O to open a different folder</p>
            )}
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
            <input type="text" className="border w-full p-2 mb-6" placeholder="Tim interview" value={newName} onChange={e => setNewName(e.target.value)}/>
            <p className="uppercase mb-2 text-sm tracking-wide font-bold">Date</p>
            <input type="date" className="border w-full p-2 mb-6" value={newDate} onChange={e => setNewDate(e.target.value)}/>
            <button
              className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
              disabled={!(newName && newDate)}
              onClick={onCreate}
            >Create</button>
          </Modal>
          <div className="w-full">
            {(dir && selected) ? (
              <Interview dir={dir} selected={selected}/>
            ) : (
              <p className="p-4 text-center">No file open, select on sidebar or press Ctrl + N to create new file</p>
            )}
          </div>
        </div>
      ) : (
        <p className="p-4 text-center">No folder open, press Ctrl + O</p>
      )}
    </div>
  );
}