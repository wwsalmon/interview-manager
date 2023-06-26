import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, exists, readDir, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode, useEffect, useState } from "react";
import Interview from "./components/Interview";
import NewFileModal from "./components/NewFileModal";
import SettingsModal from "./components/SettingsModal";
import SidebarFile from "./components/SidebarFile";
import Website from "./components/Website";
import Audio from "./components/Audio";

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

export interface Settings {
  recent: string[],
  revKey: string,
}

// https://gist.github.com/RavenHursT/fe8a95a59109096ac1f8
const getRoot = (url = "") => (new URL(url)).hostname.split(".").slice(-2).join(".");

export function ModalLabel({children, className}: {children: ReactNode, className?: string}) {
  return (
    <p className={classNames("uppercase mb-2 text-sm tracking-wide font-bold", className)}>{children}</p>
  )
}

export function ModalInput(props: ComponentPropsWithRef<"input">) {
  let domProps = {...props};
  delete domProps.className;

  return (
    <input className={classNames("border w-full p-2 mb-6", props.className)} {...domProps}/>
  )
}

async function getMetaFromUrl(url: string) {
  const message = await invoke("get_meta_from_url", {url});
  const parser = new DOMParser();
  const html = parser.parseFromString(message as string, "text/html");
  const name = html.querySelector("meta[property='og:title']")?.getAttribute("content") || html.querySelector("title")?.innerHTML || "";
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
  const [searchString, setSearchString] = useState<string>("");
  const [isUnsaved, setIsUnsaved] = useState<boolean>(false);

  const [settings, setSettings] = useState<Settings>({recent: [], revKey: ""});

  const [isSettings, setIsSettings] = useState<boolean>(false);

  async function initSettings() {
    const hasSettings = await exists("settings.json", {dir: BaseDirectory.AppConfig});

    let newSettings = {recent: [], revKey: ""};
    
    if (hasSettings) {
      console.log("loading new");
      const settingsFile = await readTextFile("settings.json", {dir: BaseDirectory.AppConfig});
      newSettings = JSON.parse(settingsFile);
    } else {
      console.log("creating new");
      await writeTextFile("settings.json", JSON.stringify(newSettings), {dir: BaseDirectory.AppConfig});
    }

    setSettings(newSettings);
  }

  useEffect(() => {
    initSettings();
  }, []);

  async function updateRecent(newDir: string) {
    if (!newDir) return;
    let newSettings = {...settings};
    newSettings.recent = [newDir, ...settings.recent.filter(d => d !== newDir).slice(0, 5)];
    setSettings(newSettings);
    await writeTextFile("settings.json", JSON.stringify(newSettings), {dir: BaseDirectory.AppConfig});
  }

  useEffect(() => {
    listen("menu-event", e => {
      try {
        if (e.payload === "open-event") {
          setIsOpen(true);
        } else if (e.payload === "new-event") {
          setIsNew(true);
        } else if (e.payload === "settings-event") {
          setIsSettings(true);
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
    if (!filepath) {
      setIsOpenLoading(false);
      return;
    }
    setDir(filepath as string);
    updateRecent(filepath as string);
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
        return extension && [".szhi", ".szhw", ".szha"].includes(extension);
      });

      const newContents = await Promise.all(files.map(file => readTextFile(dir + "/" + file.name, {dir: BaseDirectory.Home})));
      const newParsed = newContents.map(d => JSON.parse(d));
      const newFiles = newParsed.map((d, i) => ({...d, fileName: files[i].name}));
      setContents(newFiles);
      setIsUnsaved(false);
    }
  }

  function getProjectName() {
    if (!dir) return "";
    const dirSplit = dir.split("/");
    return dirSplit[dirSplit.length - 1];
  }

  function afterDelete() {
    setSelected("");
    afterOpen();
  }

  const selectedIsWebsite = selected?.substring(selected.length - 5) === ".szhw";
  const selectedIsAudio = selected?.substring(selected.length - 5) === ".szha";
  const filteredContent = contents.filter(d => [d.name, d.body, "notes" in d ? d.notes : "", "url" in d ? d.url : "", "pub" in d ? d.pub : ""].some(x => x.toLowerCase().includes(searchString.toLowerCase())));

  return (
    <div>
      {dir ? (
        <div className="flex h-full h-screen">
          <div className="w-64 bg-gray-100 flex-shrink-0 overflow-auto">
            <p className="p-2 break-all border-b text-sm opacity-50">Project: {getProjectName()}</p>
            <div className="p-2">
              <input type="text" value={searchString} onChange={e => setSearchString(e.target.value)} placeholder="Search files" className="text-sm w-full p-1 border"/>
            </div>
            {contents.length ? (
              <p className="text-xs px-4 py-1 opacity-50">{filteredContent.length} file{filteredContent.length === 1 ? "" : "s"} {searchString && "matching search query"}</p>
            ) : (
              <p className="text-sm p-2">No files yet, press Ctrl + N to create a new one, or Ctrl + O to open a different folder</p>
            )}
            {filteredContent.map((d) => (
              <SidebarFile key={d.fileName} content={d} selected={selected} setSelected={setSelected} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved}/>
            ))}
          </div>
          <NewFileModal isNewModal={isNewModal} setIsNewModal={setIsNewModal} dir={dir} afterOpen={afterOpen} setSelected={setSelected} revKey={settings.revKey}/>
          <div style={{width: "calc(100% - 256px)"}}>
            {(dir && selected) ? selectedIsWebsite ? (
              <Website dir={dir} selected={selected} afterDelete={afterDelete} updateSidebar={afterOpen} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved}/>
            ) : selectedIsAudio ? (
              <Audio dir={dir} selected={selected} setSelected={setSelected} afterDelete={afterDelete} updateSidebar={afterOpen} revKey={settings.revKey} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved}/>
            ) : (
              <Interview dir={dir} selected={selected} afterDelete={afterDelete} updateSidebar={afterOpen} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved}/>
            ) : (
              <p className="p-4 text-center">No file open, select on sidebar or press Ctrl + N to create new file</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="p-4 text-center">No folder open, press Ctrl + O</p>
          <div className="max-w-sm mx-auto">
            <p className="uppercase font-bold text-sm my-6">Recently opened projects</p>
            {settings.recent.length ? settings.recent.map(d => (
              <button className="p-2 block w-full bg-gray-100 hover:bg-gray-300 my-2" key={d} onClick={() => {
                setDir(d);
                updateRecent(d);
                setSelected("");
              }}>{d}</button>
            )) : (
              <p>No recently opened projects.</p>
            )}
          </div>
        </>
      )}
      <SettingsModal isSettings={isSettings} setIsSettings={setIsSettings} settings={settings} setSettings={setSettings}/>
    </div>
  );
}