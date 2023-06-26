import { BaseDirectory, readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import { useEffect, useState } from "react";
import Textarea from "./Textarea";
import { listen } from "@tauri-apps/api/event";
import { AreaLabel, Container, HalfContainer, TopbarInput, TopbarLabel } from "./FileArea";
import { FileAreaProps } from "./Audio";

export default function Website({dir, selected, afterDelete, updateSidebar, isUnsaved, setIsUnsaved}: FileAreaProps) {
    const [name, setName] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [pub, setPub] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [contents, setContents] = useState<{name: string, date: string, body: string, url: string, pub: string}>({name: "", date: "", body: "", url: "", pub: ""});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showWebsite, setShowWebsite] = useState<boolean>(false);

    const hasUnsaved = (contents.body !== body) || (contents.date !== date) || (contents.pub !== pub) || (contents.name !== name);

    useEffect(() => {
        if (hasUnsaved !== isUnsaved) {
            setIsUnsaved(hasUnsaved);
        }
    }, [hasUnsaved]);

    useEffect(() => {
        onLoad();
    }, [dir, selected]);

    async function onLoad() {
        const content = await readTextFile(dir + "/" + selected, {dir: BaseDirectory.Home});
    
        const parsed = JSON.parse(content);
        if (!(["url", "pub", "body", "name", "date"].every(d => Object.keys(parsed).includes(d)))) return;
    
        setContents({name: parsed.name, date: parsed.date, pub: parsed.pub, body: parsed.body, url: parsed.url});
        
        setName(parsed.name);
        setDate(parsed.date);
        setPub(parsed.pub);
        setUrl(parsed.url);
        setBody(parsed.body);
    }

    useEffect(() => {
      listen("menu-event", e => {
        try {
          if (e.payload === "save-event") {
            setIsSaving(true);
          }
        } catch (e) {
          console.log(e);
        }
      });
    }, []);

    useEffect(() => {
        if (isSaving) {
            onSave();
        }
    }, [isSaving]);

    async function onSave() {
        if (isLoading) return;

        setIsLoading(true);

        await writeTextFile(dir + "/" + selected, JSON.stringify({name, url, pub, date, body}), {dir: BaseDirectory.Home});

        await onLoad();

        setIsLoading(false);
        setIsSaving(false);

        updateSidebar();
    }

    async function onDelete() {
        if (isLoading) return;

        setIsLoading(true);

        await removeFile(dir + "/" + selected, {dir: BaseDirectory.Home});

        afterDelete();
    }

    return (
        <Container
            topbar={(
                <>
                    <TopbarLabel>URL</TopbarLabel>
                    <a href={url} target="_blank" className="mr-4 text-sm underline truncate w-32 flex-shrink-0">{url}</a>
                    <TopbarLabel>Name</TopbarLabel>
                    <TopbarInput type="text" value={name} onChange={e => setName(e.target.value)}/>
                    <TopbarLabel>Pub</TopbarLabel>
                    <TopbarInput type="text" value={pub} onChange={e => setPub(e.target.value)}/>
                    <TopbarLabel>Date</TopbarLabel>
                    <TopbarInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-24"/>
                </>
            )}
            isLoading={isLoading}
            hasUnsaved={hasUnsaved}
            onSave={onSave}
            onDelete={onDelete}
        >
            <div className="w-1/2 flex-shrink-0 flex-grow-0 border-r h-full overflow-hidden">
                {showWebsite ? (
                    <iframe src={url} className="w-[133%] h-[133%] transform scale-75 origin-top-left"></iframe>
                ) : (
                    <div className="p-8">
                        <AreaLabel>{contents.pub}</AreaLabel>
                        <p className="-mt-4 text-xl mb-4 opacity-50">{contents.name}</p>
                        <p className="mb-12 text-sm opacity-50">{url}</p>
                        <AreaLabel>Show website</AreaLabel>
                        <div className="flex items-center mb-8">
                            <a href={url} className="text-sm text-white px-4 py-1 bg-gray-800 block" target="_blank">Open in new window</a>
                            <button onClick={() => setShowWebsite(true)} className="px-4 py-1 text-sm text-white bg-gray-800 ml-4">Open in app</button>
                        </div>
                        <p className="opacity-50 text-xs">Opening the website in app may fail as some websites don't allow being put in iframe</p>
                    </div>
                )}
            </div>
            <HalfContainer>
                <AreaLabel>Notes</AreaLabel>
                <Textarea value={body} setValue={setBody} placeholder="Summary, good quotes, etc."/>
            </HalfContainer>
        </Container>
    )
}