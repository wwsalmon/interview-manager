import { invoke } from "@tauri-apps/api";
import { confirm, open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, createDir, exists, readDir, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode, useEffect, useState } from "react";
import { FiFolder } from "react-icons/fi";
import Audio, { AudioFile } from "./components/Audio";
import Interview from "./components/Interview";
import Modal from "./components/Modal";
import NewFile from "./components/NewFile";
import SidebarFile from "./components/SidebarFile";
import Website from "./components/Website";
import ShellLink from "./components/ShellLink";

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

export type FileContent = InterviewFile | WebsiteFile | (AudioFile & {fileName: string});

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

  const [settings, setSettings] = useState<Settings | null>(null);
  const [newRevKey, setNewRevKey] = useState<string>("");
  const [isEditKey, setIsEditKey] = useState<boolean>(false);

  const [isSettingLoading, setIsSettingLoading] = useState<boolean>(false);

  async function initSettings() {
    const hasSettings = await exists("settings.json", {dir: BaseDirectory.AppConfig});

    let newSettings = {recent: [], revKey: ""};
    
    if (hasSettings) {
      console.log("loading new");
      const settingsFile = await readTextFile("settings.json", {dir: BaseDirectory.AppConfig});
      newSettings = JSON.parse(settingsFile);
    } else {
      console.log("creating new");

      const hasSettingsDir = await exists("", {dir: BaseDirectory.AppConfig});

      if (!hasSettingsDir) {
          await createDir("", {dir: BaseDirectory.AppConfig, recursive: true});
      }

      await writeTextFile("settings.json", JSON.stringify(newSettings), {dir: BaseDirectory.AppConfig});
    }

    setSettings(newSettings);
    setNewRevKey(newSettings.revKey);
  }

  useEffect(() => {
    initSettings();
  }, []);

  async function updateRecent(newDir: string) {
    if (!newDir || settings === null) return;
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
      const newFiles = newParsed.map((d, i) => ({...d, fileName: files[i].name})).sort((a,b) => (a.date && b.date) ? (+new Date(b.date) - +new Date(a.date)) : 0);
      setContents(newFiles);
      setIsUnsaved(false);

      if (newFiles.length) {
        setSelected(newFiles[0].fileName);
      }
    }
  }

  async function onClose() {
    if (isUnsaved) {
        const confirmed = await confirm("You will lose your changes on this document if you proceed.", {title: "Unsaved changes"})

        if (!confirmed) return;
    }

    setDir("");
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

  async function onSave(newSettings: Settings) {
      if (isSettingLoading) return;
      setIsSettingLoading(true);
      const hasSettingsDir = await exists("", {dir: BaseDirectory.AppConfig});

      if (!hasSettingsDir) {
          await createDir("", {dir: BaseDirectory.AppConfig, recursive: true});
      }
  
      await writeTextFile("settings.json", JSON.stringify(newSettings), {dir: BaseDirectory.AppConfig});
  
      setSettings(newSettings);
      setIsSettingLoading(false);
      setIsEditKey(false);
  }
  
  async function onSaveRevKey() {
    if (settings === null) return;

    let newSettings = {...settings};

    newSettings.revKey = newRevKey;

    onSave(newSettings);
  }

  const selectedIsWebsite = selected?.substring(selected.length - 5) === ".szhw";
  const selectedIsAudio = selected?.substring(selected.length - 5) === ".szha";
  const filteredContent = contents
    .filter(d => [d.name, "body" in d ? d.body : "", "notes" in d ? d.notes : "", "url" in d ? d.url : "", "pub" in d ? d.pub : ""].some(x => x.toLowerCase().includes(searchString.toLowerCase())));

  const version = "0.1.3";

  return (
    <div>
      {(settings !== null && dir) ? (
        <>
          {/* PROJECT UI */}
          {/* PROJECT UI */}
          {/* PROJECT UI */}
          <div className="flex h-full h-screen">
            <div className="w-72 flex-shrink-0 overflow-auto border-r">
              <div className="flex items-center gap-4 p-3">
                <button className="w-6 h-6 flex items-center justify-center border border-black rounded opacity-25 hover:opacity-100 flex-shrink-0" onClick={onClose}>←</button>
                <p className="font-bold truncate">{getProjectName()}</p>
              </div>
              <div className="px-3 my-4">
                <button onClick={onNew} className="accent-button w-full block my-4 ">+ Add interview</button>
                <label className="text-xs font-medium mb-2 inline-block">Search interviews ({filteredContent.length}{searchString && " matching query"})</label>
                <input type="text" value={searchString} onChange={e => setSearchString(e.target.value)} placeholder="Search title and body text" className="text-sm w-full p-1 border rounded"/>
              </div>
              {filteredContent.map((d) => (
                <SidebarFile key={d.fileName} content={d} selected={selected} setSelected={setSelected} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved}/>
              ))}
              <div className="px-3 pb-3 opacity-50">
                <hr className="my-3"/>
                <div className="flex items-center gap-4">
                <img src="/3dlogo.png" alt="szhim logo" className="h-8"/>
                <div>
                  <h1 className="font-bold">Interview manager</h1>
                  <p className="font-mono text-xs">v{version}</p>
                </div>
              </div>
              </div>
            </div>
            <Modal isOpen={isNewModal} setIsOpen={setIsNewModal}>
                <NewFile setIsNewModal={setIsNewModal} dir={dir} afterOpen={afterOpen} setSelected={setSelected} revKey={settings.revKey}/>
            </Modal>
            <div style={{width: "calc(100% - 280px)"}} className="bg-white shadow-xl">
              {(dir && selected) ? selectedIsWebsite ? (
                <Website dir={dir} selected={selected} afterDelete={afterDelete} updateSidebar={afterOpen} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved} key={selected}/>
              ) : selectedIsAudio ? (
                <Audio dir={dir} selected={selected} setSelected={setSelected} afterDelete={afterDelete} updateSidebar={afterOpen} revKey={settings.revKey} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved} key={selected}/>
              ) : (
                <Interview dir={dir} selected={selected} afterDelete={afterDelete} updateSidebar={afterOpen} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved} key={selected}/>
              ) : (
                <div className="max-w-md mx-auto px-4 py-8">
                  <NewFile setIsNewModal={setIsNewModal} dir={dir} afterOpen={afterOpen} setSelected={setSelected} revKey={settings.revKey}/>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* HOME UI */}
          {/* HOME UI */}
          {/* HOME UI */}
          <div className="max-w-md p-8 bg-white shadow-lg mx-auto mt-16 rounded-lg overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="flex items-center gap-8">
              <img src="/3dlogo.png" alt="szhim logo" className="h-16"/>
              <div>
                <h1 className="text-xl font-bold">Interview manager</h1>
                <p className="font-mono text-sm">v{version}</p>
              </div>
            </div>
            {settings === null ? (
              <>
                <p className="mt-6">Loading settings...</p>
              </>
            ) : (settings?.revKey && !isEditKey) ? (
              <>
                <div className="flex items-center gap-4 my-12">
                  <p className="opacity-50 text-sm">Open a project folder (any folder) to save interviews and transcripts to.</p>
                  <button className="!text-xs leading-none accent-button flex items-center gap-3 ml-auto flex-shrink-0" onClick={onOpen}><FiFolder></FiFolder> Open folder</button>
                </div>
                <p className="uppercase font-bold text-sm mt-12">Recent folders</p>
                {settings.recent.length ? settings.recent.map(d => (
                  <button className="text-left block mt-6 opacity-50 hover:opacity-100" key={d} onClick={() => {
                    setDir(d);
                    updateRecent(d);
                    setSelected("");
                  }}>
                    <p className="font-mono text-xs opacity-50">{d.replace(/(^.*?)([^\\\/]*)$/, "$1")}</p>
                    <p className="font-semibold">{d.replace(/(^.*?)([^\\\/]*)$/, "$2")}</p>
                  </button>
                )) : (
                  <p>No recently opened projects.</p>
                )}
                <label className="uppercase text-xs font-bold mb-4 border-t pt-6 mt-6 block opacity-50">Rev.ai access token</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly={true} value={settings.revKey} className="rounded px-1 py-[2px] text-xs font-mono border w-full"/>
                  <button className="text-xs px-1 py-[2px] rounded border opacity-25 hover:opacity-50" onClick={() => setIsEditKey(true)}>Edit</button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-mono text-accent mt-6">Add Rev.ai access token to continue</h1>
                <p className="my-6">This app uses a cloud service called <ShellLink href="https://www.rev.ai/" className="font-bold underline">Rev.ai</ShellLink> to transcribe audio. You get 5 hours for free, past that it’s $0.02/minute.</p>
                <p className="my-6"><ShellLink href="https://www.rev.ai/auth/signup" className="font-bold underline">Sign up at rev.ai</ShellLink>, then create an access token (go to Access Token in the sidebar once you log in) and add it below to continue.</p>
                <div className="flex items-center gap-2 mt-6">
                  <input type="text" value={newRevKey} onChange={e => setNewRevKey(e.target.value)} className="border rounded text-sm px-3 py-2 w-full"/>
                  <button className="accent-button flex items-center gap-2 flex-shrink-0" disabled={!newRevKey || isSettingLoading} onClick={onSaveRevKey}>{isSettingLoading ? "Loading..." : "Continue →"}</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}