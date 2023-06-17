import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, FileEntry, readDir, writeTextFile } from "@tauri-apps/api/fs";
import classNames from "classnames";
import { ReactNode, useEffect, useState } from "react";
import Modal from "react-modal";
import Interview from "./components/Interview";
import makeFile from "./utils/makeFile";
import makeLinkFile from "./utils/makeLinkFile";
import short from "short-uuid";
import { invoke } from "@tauri-apps/api";

// https://gist.github.com/RavenHursT/fe8a95a59109096ac1f8
const getRoot = (url = "") => (new URL(url)).hostname.split(".").slice(-2).join(".");

function Label({children}: {children: ReactNode}) {
  return (
    <p className="uppercase mb-2 text-sm tracking-wide font-bold">{children}</p>
  )
}

async function getMetaFromUrl(url: string) {
  const message = await invoke("get_meta_from_url", {url});
  const parser = new DOMParser();
  const html = parser.parseFromString(message as string, "text/html");
  const name = html.querySelector("meta[property='og:title']")?.getAttribute("content") || "";
  const pub = html.querySelector("meta[property='og:site_name']")?.getAttribute("content") || getRoot(url);
  const date = html.querySelector("meta[property='article:published_time']")?.getAttribute("content") || "";
  return {name, pub, date};
}

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenLoading, setIsOpenLoading] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [isNewModal, setIsNewModal] = useState<boolean>(false);
  const [dir, setDir] = useState<string | null>(null);
  const [contents, setContents] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [isLink, setIsLink] = useState<boolean>(false);
  const [isLinkLoading, setIsLinkLoading] = useState<boolean>(false);
  
  const [newName, setNewName] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");

  const [newUrl, setNewUrl] = useState<string>("");
  const [newPub, setNewPub] = useState<string>("");
  // new name also used for links
  // new date also used for links

  useEffect(() => {
    getMetaFromUrl("https://www.samsonzhang.com/").then(res => console.log(res));
  }, []);

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
      files = files.filter(d => (d.name?.substring(d.name.length - 10) === ".interview") || (d.name?.substring(d.name.length - 8) === ".website"));
      setContents(files);
    }
  }

  async function fillInfoFromUrl() {
    if (!newUrl) return;

    setIsLinkLoading(true);

    try {
      const meta = await getMetaFromUrl(newUrl);

      setNewName(meta.name);
      setNewPub(meta.pub);
      setNewDate(meta.date);
    } catch (e) {
      console.log(e);
    }

    setIsLinkLoading(false);
  }

  function getProjectName() {
    if (!dir) return "";
    const dirSplit = dir.split("/");
    return dirSplit[dirSplit.length - 1];
  }

  async function onCreate() {
    const fileContent = isLink ? makeLinkFile(newName, newUrl, newPub, newDate, "") : makeFile(newName, newDate, "", "");

    const fileName = encodeURIComponent(newName).substring(0, 20)  + "-" + short.generate() + (isLink ? ".website" : ".interview");

    await writeTextFile(dir + "/" + fileName, fileContent, {dir: BaseDirectory.Home});

    await afterOpen();

    setSelected(fileName);
    setNewName("");
    setNewDate("");
    setNewUrl("");
    setNewPub("");
    setIsNewModal(false);
  }

  const canCreate = newName && (!isLink || newUrl);

  return (
    <div>
      {dir ? (
        <div className="flex h-full min-h-screen">
          <div className="w-64 bg-gray-100 flex-shrink-0">
            <p className="p-2 break-all border-b text-sm opacity-50">Project: {getProjectName()}</p>
            {contents.map((d) => (
              <button
                className={classNames("p-4 block w-full text-left break-all truncate", selected === d.name ? "bg-white disabled border-t border-b" : "hover:bg-gray-200")}
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
                height: "auto",
              }
            }}
          >
            <div className="mb-6 flex items-center justify-center"> 
              <p className="font-bold mr-1">New</p>
              <button onClick={() => setIsLink(false)} className={classNames(!isLink ? "font-bold bg-gray-100" : "opacity-50 hover:opacity-100", "p-1 border text-sm")}>interview</button>
              <button onClick={() => setIsLink(true)} className={classNames(isLink ? "font-bold bg-gray-100" : "opacity-50 hover:opacity-100", "p-1 border text-sm")}>link</button>
            </div>
            {isLink && (
              <>
                <Label>URL</Label>
                <input type="text" className="border w-full p-2 mb-6" placeholder="ex. https://www.sacbee.com/..." value={newUrl} onChange={e => setNewUrl(e.target.value)}/>
                <button onClick={fillInfoFromUrl} disabled={!newUrl || isLinkLoading} className="mb-6 p-1 text-sm border disabled:opacity-50 bg-gray-700 text-white">{isLinkLoading ? "Loading..." : "Get info from URL"}</button>
              </>
            )}
            <Label>Name</Label>
            <input type="text" className="border w-full p-2 mb-6" placeholder="ex. Tim interview" value={newName} onChange={e => setNewName(e.target.value)}/>
            {isLink && (
              <>
                <Label>Publication</Label>
                <input type="text" className="border w-full p-2 mb-6" placeholder="ex. The Sacramento Bee" value={newPub} onChange={e => setNewPub(e.target.value)}/>
              </>
            )}
            <Label>Date</Label>
            <input type="date" className="border w-full p-2 mb-6" value={newDate} onChange={e => setNewDate(e.target.value)}/>
            <button
              className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
              disabled={!canCreate}
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