import { Dispatch, SetStateAction, useState } from "react";
import Modal from "./Modal";
import { invoke } from "@tauri-apps/api";
import { ModalInput, ModalLabel } from "../App";
import classNames from "classnames";
import makeWebsiteFile from "../utils/makeWebsiteFile";
import makeFile from "../utils/makeFile";
import short from "short-uuid";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

export default function NewFileModal({isNewModal, setIsNewModal, dir, afterOpen, setSelected}: {isNewModal: boolean, setIsNewModal: Dispatch<SetStateAction<boolean>>, dir: string, afterOpen: () => Promise<any>, setSelected: Dispatch<SetStateAction<string>>}) {
    const [isWebsite, setIsWebsite] = useState<boolean>(false);
    const [isWebsiteLoading, setIsWebsiteLoading] = useState<boolean>(false);
    const [websiteError, setWebsiteError] = useState<string>("");
    
    const [newName, setNewName] = useState<string>("");
    const [newDate, setNewDate] = useState<string>("");
  
    const [newUrl, setNewUrl] = useState<string>("");
    const [newPub, setNewPub] = useState<string>("");

    async function fillInfoFromUrl() {
        if (!newUrl) return;
    
        setIsWebsiteLoading(true);
        setWebsiteError("");
    
        try {
          const meta = await getMetaFromUrl(newUrl);
    
          setNewName(meta.name);
          setNewPub(meta.pub);
          setNewDate(meta.date);
        } catch (e) {
          setWebsiteError(e as string);
        }
    
        setIsWebsiteLoading(false);
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

    return (
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
                <ModalLabel>URL</ModalLabel>
                <ModalInput placeholder="ex. https://www.sacbee.com/..." value={newUrl} onChange={e => setNewUrl(e.target.value)}/>
                <button onClick={fillInfoFromUrl} disabled={!newUrl || isWebsiteLoading} className="mb-6 p-1 text-sm border disabled:opacity-50 bg-gray-700 text-white">{isWebsiteLoading ? "Loading..." : "Get info from URL"}</button>
                {websiteError && (
                  <p className="text-xs text-red-500 mb-6 break-all"><span className="font-bold">Error getting info from URL:</span> <span className="font-mono">{websiteError}</span>.<br/><br/>You can still save this URL by adding a name manually.</p>
                )}
              </>
            )}
            <ModalLabel>Name</ModalLabel>
            <ModalInput placeholder="ex. Tim interview" value={newName} onChange={e => setNewName(e.target.value)}/>
            {isWebsite && (
              <>
                <ModalLabel>Publication</ModalLabel>
                <ModalInput placeholder="ex. The Sacramento Bee" value={newPub} onChange={e => setNewPub(e.target.value)}/>
              </>
            )}
            <ModalLabel>Date</ModalLabel>
            <ModalInput type="date" value={newDate} onChange={e => setNewDate(e.target.value)}/>
            <button
              className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
              disabled={!canCreate}
              onClick={onCreate}
            >Create</button>
          </Modal>
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

// https://gist.github.com/RavenHursT/fe8a95a59109096ac1f8
const getRoot = (url = "") => (new URL(url)).hostname.split(".").slice(-2).join(".");