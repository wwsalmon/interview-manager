import { Dispatch, SetStateAction, useState } from "react";
import { invoke } from "@tauri-apps/api";
import short from "short-uuid";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";

export default function NewFile({ setIsNewModal, dir, afterOpen, setSelected, revKey }: { setIsNewModal: Dispatch<SetStateAction<boolean>>, dir: string, afterOpen: () => Promise<any>, setSelected: Dispatch<SetStateAction<string>>, revKey?: string }) {
    const [audioFile, setAudioFile] = useState<string>("");
    const [audioLoading, setAudioLoading] = useState<boolean>(false);

    // for create manually
    async function onCreate() {
        const fileContent = JSON.stringify({name: "Untitled", date: new Date(), body: "", notes: ""});
        const fileName = encodeURIComponent("manual").substring(0, 20) + "-" + short.generate() + ".szhi";

        await writeTextFile(dir + "/" + fileName, fileContent, { dir: BaseDirectory.Home });
        await afterOpen();

        setSelected(fileName);
        setIsNewModal(false);
    }

    async function submitAudio() {
        setAudioLoading(true);

        if (!audioFile || !revKey) return;

        try {
            const res = await invoke("upload_rev", {path: audioFile, key: revKey });
            const parsed = JSON.parse(res as string);

            const newName = audioFile.split("/").pop()?.replace(/(^.*)\..*$/, "$1") || "Untitled";
            const fileName = encodeURIComponent(newName).substring(0, 20) + "-" + short.generate() + ".szha";

            await writeTextFile(dir + "/" + fileName, JSON.stringify({name: newName, date: new Date(), id: parsed.id, path: audioFile, status: parsed.status, failure_detail: parsed.failure_detail || ""}), { dir: BaseDirectory.Home });
            await afterOpen();

            setSelected(fileName);
            setAudioFile("");
            setIsNewModal(false);
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
        <>
            <h2 className="font-bold">Add interview</h2>
            <p>Upload audio file to transcribe</p>
            <button className="text-center w-full py-4 bg-neutral-100 rounded border hover:brightness-90 my-4 font-mono text-sm" onClick={openAudioFile}>Upload audio file</button>
            {audioFile && (
                <p className="font-mono text-sm"><b>Selected:</b> {audioFile.split("/").pop()}</p>
            )}
            <div className="flex items-center mt-4 gap-4">
                <button className="accent-button" disabled={!audioFile || audioLoading} onClick={submitAudio}>{audioLoading ? "Loading..." : "Transcribe →"}</button>
                <button className="font-mono text-sm font-semibold px-3 py-2 rounded opacity-75 hover:opacity-100 border" disabled={audioLoading} onClick={onCreate}>Add manually</button>
            </div>
        </>
    )
}