import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, FileEntry, readDir, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import classNames from "classnames";
import { ReactNode, useEffect, useState } from "react";
import Interview from "./components/Interview";
import makeFile from "./utils/makeFile";
import makeWebsiteFile from "./utils/makeWebsiteFile";
import short from "short-uuid";
import { invoke } from "@tauri-apps/api";
import Website from "./components/Website";
import Modal from "./components/Modal";
import SidebarFile from "./components/SidebarFile";

export interface InterviewFile {
  name: string,
  date: string,
  body: string,
  notes: string,
  fileName: string,
}

export interface WebsiteFile {
  name: string,
  date: string,
  body: string,
  url: string,
  pub: string,
  fileName: string,
}

export type FileContent = InterviewFile | WebsiteFile;

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
  const date = html.querySelector("meta[property='article:published_time']")?.getAttribute("content")?.substring(0, 10) || "";
  return {name, pub, date};
}

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenLoading, setIsOpenLoading] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [isNewModal, setIsNewModal] = useState<boolean>(false);
  const [dir, setDir] = useState<string | null>(null);
  const [contents, setContents] = useState<FileContent[]>([]);
  const [selected, setSelected] = useState<string>("");

  const [isWebsite, setIsWebsite] = useState<boolean>(false);
  const [isWebsiteLoading, setIsWebsiteLoading] = useState<boolean>(false);
  
  const [newName, setNewName] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");

  const [newUrl, setNewUrl] = useState<string>("");
  const [newPub, setNewPub] = useState<string>("");

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
    setSelected("");
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

      files = files.filter(d => {
        const extension = d.name?.substring(d.name.length - 5);
        return extension && [".szhi", ".szhw"].includes(extension);
      });

      const newContents = await Promise.all(files.map(file => readTextFile(dir + "/" + file.name, {dir: BaseDirectory.Home})));
      const newParsed = newContents.map(d => JSON.parse(d));
      const newFiles = newParsed.map((d, i) => ({...d, fileName: files[i].name}));
      setContents(newFiles);
    }
  }

  async function fillInfoFromUrl() {
    if (!newUrl) return;

    setIsWebsiteLoading(true);

    try {
      const meta = await getMetaFromUrl(newUrl);

      setNewName(meta.name);
      setNewPub(meta.pub);
      setNewDate(meta.date);
    } catch (e) {
      console.log(e);
    }

    setIsWebsiteLoading(false);
  }

  function getProjectName() {
    if (!dir) return "";
    const dirSplit = dir.split("/");
    return dirSplit[dirSplit.length - 1];
  }

  async function onCreate() {
    const fileContent = isWebsite ? makeWebsiteFile(newName, newUrl, newPub, newDate, "") : makeFile(newName, newDate, "", "");

    const fileName = encodeURIComponent(newName).substring(0, 20)  + "-" + short.generate() + (isWebsite ? ".szhw" : ".szhi");

    await writeTextFile(dir + "/" + fileName, fileContent, {dir: BaseDirectory.Home});

    await afterOpen();

    setSelected(fileName);
    setNewName("");
    setNewDate("");
    setNewUrl("");
    setNewPub("");
    setIsNewModal(false);
  }

  const canCreate = newName && (!isWebsite || newUrl);

  const selectedIsWebsite = selected?.substring(selected.length - 5) === ".szhw";

  return (
    <div>
      {dir ? (
        <div className="flex h-full h-screen">
          <div className="w-64 bg-gray-100 flex-shrink-0 overflow-auto">
            <p className="p-2 break-all border-b text-sm opacity-50">Project: {getProjectName()}</p>
            {contents.map((d) => (
              <SidebarFile key={d.fileName} content={d} selected={selected} setSelected={setSelected}/>
            ))}
            {!contents.length && (
              <p className="text-sm p-2">No files yet, press Ctrl + N to create a new one, or Ctrl + O to open a different folder</p>
            )}
          </div>
          <Modal
            isOpen={isNewModal}
            setIsOpen={setIsNewModal}
          >
            <div className="mb-6 flex items-center justify-center"> 
              <p className="font-bold mr-1">New</p>
              <button onClick={() => setIsWebsite(false)} className={classNames(!isWebsite ? "font-bold bg-gray-100" : "opacity-50 hover:opacity-100", "p-1 border text-sm")}>interview</button>
              <button onClick={() => setIsWebsite(true)} className={classNames(isWebsite ? "font-bold bg-gray-100" : "opacity-50 hover:opacity-100", "p-1 border text-sm")}>website</button>
            </div>
            {isWebsite && (
              <>
                <Label>URL</Label>
                <input type="text" className="border w-full p-2 mb-6" placeholder="ex. https://www.sacbee.com/..." value={newUrl} onChange={e => setNewUrl(e.target.value)}/>
                <button onClick={fillInfoFromUrl} disabled={!newUrl || isWebsiteLoading} className="mb-6 p-1 text-sm border disabled:opacity-50 bg-gray-700 text-white">{isWebsiteLoading ? "Loading..." : "Get info from URL"}</button>
              </>
            )}
            <Label>Name</Label>
            <input type="text" className="border w-full p-2 mb-6" placeholder="ex. Tim interview" value={newName} onChange={e => setNewName(e.target.value)}/>
            {isWebsite && (
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
          <div style={{width: "calc(100% - 256px)"}}>
            {(dir && selected) ? selectedIsWebsite ? (
              <Website dir={dir} selected={selected} afterDelete={() => {
                setSelected("");
                afterOpen();
              }}/>
            ) : (
              <Interview dir={dir} selected={selected} afterDelete={() => {
                setSelected("");
                afterOpen();
              }}/>
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