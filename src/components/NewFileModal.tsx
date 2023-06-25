import { Dispatch, SetStateAction, useState } from "react";
import Modal from "./Modal";
import { invoke } from "@tauri-apps/api";
import { ModalInput, ModalLabel } from "../App";
import classNames from "classnames";
import makeWebsiteFile from "../utils/makeWebsiteFile";
import makeFile from "../utils/makeFile";
import short from "short-uuid";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import axios from "axios";
import { open } from "@tauri-apps/api/dialog";

export default function NewFileModal({ isNewModal, setIsNewModal, dir, afterOpen, setSelected, revKey }: { isNewModal: boolean, setIsNewModal: Dispatch<SetStateAction<boolean>>, dir: string, afterOpen: () => Promise<any>, setSelected: Dispatch<SetStateAction<string>>, revKey?: string }) {
    const [tab, setTab] = useState<string>("interview");
    const [isWebsiteLoading, setIsWebsiteLoading] = useState<boolean>(false);
    const [websiteError, setWebsiteError] = useState<string>("");

    const [newName, setNewName] = useState<string>("");
    const [newDate, setNewDate] = useState<string>("");

    const [newUrl, setNewUrl] = useState<string>("");
    const [newPub, setNewPub] = useState<string>("");

    const [audioFile, setAudioFile] = useState<string>();
    const [audioLoading, setAudioLoading] = useState<boolean>(false);

    const isWebsite = tab === "website";

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

        const fileName = encodeURIComponent(newName).substring(0, 20) + "-" + short.generate() + (isWebsite ? ".szhw" : ".szhi");

        await writeTextFile(dir + "/" + fileName, fileContent, { dir: BaseDirectory.Home });

        await afterOpen();

        setSelected(fileName);
        setNewName("");
        setNewDate("");
        setNewUrl("");
        setNewPub("");
        setIsNewModal(false);
    }

    const canCreate = newName && (!isWebsite || newUrl);

    async function submitAudio() {
        setAudioLoading(true);

        if (!audioFile || !revKey) return;

        try {
            const res = await invoke("upload_rev", {path: audioFile, key: revKey });
            console.log(res);
        } catch (e) {
            console.log(e);
        }

        setAudioLoading(false);
    }

    async function openAudioFile() {
        let filepath = await open();

        if (filepath) setAudioFile(filepath.toString());
    }

    return (
        <Modal
            isOpen={isNewModal}
            setIsOpen={setIsNewModal}
        >
            <div className="mb-6 flex items-center justify-center">
                <p className="font-bold mr-1">New</p>
                {["interview", "website", "audio"].map(d => (
                    <button key={d} onClick={() => setTab(d)} className={classNames((tab === d) ? "font-bold bg-gray-100" : "opacity-50 hover:opacity-100", "p-1 border text-sm")}>{d}</button>
                ))}
            </div>
            {(tab === "audio") && revKey ? (
                <>
                    <p className="mb-6">Upload an audio file to get an automatic transcript generated.</p>
                    <div className="flex items-center mb-6">
                        <button className="mr-4 bg-gray-100 px-4 py-1 flex-shrink-0" onClick={openAudioFile}>Choose file</button>
                        <span className="truncate">{audioFile}</span>
                    </div>
                </>
            ) : (
                <p>No rev.ai key configured. Press Ctrl/Cmd + , to set up a rev.ai key and use audio transcription.</p>
            )}
            {(tab === "website") && (
                <>
                    <ModalLabel>URL</ModalLabel>
                    <ModalInput placeholder="ex. https://www.sacbee.com/..." value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                    <button onClick={fillInfoFromUrl} disabled={!newUrl || isWebsiteLoading} className="mb-6 p-1 text-sm border disabled:opacity-50 bg-gray-700 text-white">{isWebsiteLoading ? "Loading..." : "Get info from URL"}</button>
                    {websiteError && (
                        <p className="text-xs text-red-500 mb-6 break-all"><span className="font-bold">Error getting info from URL:</span> <span className="font-mono">{websiteError}</span>.<br /><br />You can still save this URL by adding a name manually.</p>
                    )}
                </>
            )}
            {(revKey || tab !== "audio") && (
                <>
                    <ModalLabel>Name</ModalLabel>
                    <ModalInput placeholder="ex. Tim interview" value={newName} onChange={e => setNewName(e.target.value)} />
                    {(tab === "website") && (
                        <>
                            <ModalLabel>Publication</ModalLabel>
                            <ModalInput placeholder="ex. The Sacramento Bee" value={newPub} onChange={e => setNewPub(e.target.value)} />
                        </>
                    )}
                    <ModalLabel>Date</ModalLabel>
                    <ModalInput type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </>
            )}
            {(revKey && tab === "audio") ? (
                <button
                    className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
                    disabled={audioLoading || !audioFile || !newName}
                    onClick={submitAudio}
                >{audioLoading ? "Loading..." : "Submit"}</button>
            ) : (
                <button
                    className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
                    disabled={!canCreate}
                    onClick={onCreate}
                >Create</button>
            )}
        </Modal>
    )
}

async function getMetaFromUrl(url: string) {
    const message = await invoke("get_meta_from_url", { url });
    const parser = new DOMParser();
    const html = parser.parseFromString(message as string, "text/html");
    const name = html.querySelector("meta[property='og:title']")?.getAttribute("content") || html.querySelector("title")?.innerHTML || "";
    const pub = html.querySelector("meta[property='og:site_name']")?.getAttribute("content") || getRoot(url);
    const date = html.querySelector("meta[property='article:published_time']")?.getAttribute("content")?.substring(0, 10) || "";
    return { name, pub, date };
}

// https://gist.github.com/RavenHursT/fe8a95a59109096ac1f8
const getRoot = (url = "") => (new URL(url)).hostname.split(".").slice(-2).join(".");