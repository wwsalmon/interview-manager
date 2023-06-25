import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Container, TopbarInput, TopbarLabel } from "./FileArea";
import { BaseDirectory, readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api";
import formatRev from "../utils/formatRev";
import short from "short-uuid";

export interface AudioFile {
    name: string, date: string, id: string, status: string, path: string, failure_detail?: string, duration_seconds?: number, created_on?: string
}

export default function Audio({dir, selected, afterDelete, afterOpen, revKey, setSelected}: {dir: string, selected: string, afterDelete: () => any, afterOpen: () => any, revKey: string, setSelected: Dispatch<SetStateAction<string>>}) {
    const [contents, setContents] = useState<AudioFile>({name: "", date: "", id: "", status: "", path: ""});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function onDelete() {
        if (isLoading) return;

        setIsLoading(true);

        await removeFile(dir + "/" + selected, {dir: BaseDirectory.Home});

        afterDelete();
    }

    async function onFileLoad() {
        const content = await readTextFile(dir + "/" + selected, {dir: BaseDirectory.Home});    
        const parsed = JSON.parse(content);
        if (!(["name", "date", "id", "status"].every(d => Object.keys(parsed).includes(d)))) return;
    
        setContents({name: parsed.name, date: parsed.date, id: parsed.id, status: parsed.status, path: parsed.path, failure_detail: parsed.failure_detail || "", duration_seconds: +parsed.duration_seconds || undefined, created_on: parsed.created_on || ""});
    }

    async function onRevLoad() {
        if (!(contents.id)) return;

        setIsLoading(true);

        const message = await invoke("check_rev", {id: contents.id, key: revKey});

        const parsed = JSON.parse(message as string);

        const {created_on, status, duration_seconds, failure_detail} = parsed;

        const newContents = {
            name: contents.name,
            date: contents.date,
            id: contents.id,
            path: contents.path,
            status,
            failure_detail: failure_detail || "",
            created_on,
            duration_seconds,
        }

        setContents(newContents);

        await writeTextFile(dir + "/" + selected, JSON.stringify(newContents), {dir: BaseDirectory.Home});

        setIsLoading(false);
    }

    useEffect(() => {
        onFileLoad();
    }, [dir, selected]);
    
    async function createInterview() {
        if (contents.status !== "transcribed" || !contents.id) return;

        setIsLoading(true);

        const message = await invoke("transcript_rev", {id: contents.id, key: revKey});

        const formatted = formatRev(message as string);

        const fileName = encodeURIComponent(contents.name).substring(0, 20) + "-" + short.generate() + ".szhi";

        await writeTextFile(dir + "/" + fileName, JSON.stringify({name: contents.name, date: contents.date, body: formatted, notes: ""}), {dir: BaseDirectory.Home});

        await removeFile(dir + "/" + selected, {dir: BaseDirectory.Home});

        setSelected(fileName);

        setIsLoading(false);

        afterOpen();
    }

    return (
        <Container topbar={(
            <>
                <TopbarLabel>Name</TopbarLabel>
                <TopbarInput type="text" value={contents.name} readOnly/>
                <TopbarLabel>Date</TopbarLabel>
                <TopbarInput type="date" value={contents.date} readOnly/>
            </>
        )} isLoading={isLoading} onDelete={onDelete}>
            <div className="max-w-lg mx-auto py-8">
                {{
                    "no_check": (
                        <p>No information is currently saved about this transcription job.</p>
                    ),
                    "in_progress": (
                        <p>Your transcription is uploaded to rev.ai and will be done in a few minutes.</p>
                    ),
                    "transcribed": (
                        <>
                            <p>Your transcription is complete.</p>
                            <p>Length (seconds): {contents.duration_seconds}</p>
                        </>
                    ),
                    "failed": (
                        <>
                            <p>Your transcription job failed.</p>
                            <p>Details: {contents.failure_detail}</p>
                        </>
                    )
                }[contents.status]}
                <p>id: {contents.id}</p>
                <p>status: {contents.status}</p>
                <p>path: {contents.path}</p>
                {["no_check", "in_progress"].includes(contents.status) && (
                    <button disabled={isLoading} onClick={onRevLoad} className="px-4 py-1 text-sm text-white bg-gray-800 disabled:opacity-25">{isLoading ? "Loading..." : "Refresh"}</button>
                )}
                {["transcribed"].includes(contents.status) && (
                    <button disabled={isLoading} onClick={createInterview} className="px-4 py-1 text-sm text-white bg-gray-800 disabled:opacity-25">{isLoading ? "Loading..." : "Load transcript as interview"}</button>
                )}
            </div>
        </Container>
    )
}