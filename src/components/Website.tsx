import { BaseDirectory, readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import fm from "front-matter";
import { useEffect, useState } from "react";
import Textarea from "./Textarea";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import makeLinkFile from "../utils/makeLinkFile";
import { AreaLabel, Container, HalfContainer, TopbarInput, TopbarLabel } from "./FileArea";

export default function Website({dir, selected, afterDelete}: {dir: string, selected: string, afterDelete: () => any}) {
    const [name, setName] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [pub, setPub] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [contents, setContents] = useState<{name: string, date: string, body: string, url: string, pub: string}>({name: "", date: "", body: "", url: "", pub: ""});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const hasUnsaved = (contents.body !== body) || (contents.date !== date) || (contents.pub !== pub) || (contents.name !== name);

    useEffect(() => {
        onLoad();
    }, [dir, selected]);

    async function onLoad() {
        const content = await readTextFile(dir + "/" + selected, {dir: BaseDirectory.Home});
    
        const parsed = fm(content);
        const attributes = parsed.attributes as {[key: string]: string};

        console.log(attributes);
    
        if (!("name" in attributes && "date" in attributes && "url" in attributes && "pub" in attributes)) return;
    
        setContents({name: attributes.name, date: attributes.date, pub: attributes.pub, body: parsed.body, url: attributes.url});
        
        setName(attributes.name);
        setDate(attributes.date);
        setPub(attributes.pub);
        setUrl(attributes.url);
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

        await writeTextFile(dir + "/" + selected, makeLinkFile(name, url, pub, date, body), {dir: BaseDirectory.Home});

        await onLoad();

        setIsLoading(false);
        setIsSaving(false);
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
                <iframe src={url} className="w-[133%] h-[133%] transform scale-75 origin-top-left"></iframe>
            </div>
            <HalfContainer>
                <AreaLabel>Notes</AreaLabel>
                <Textarea value={body} setValue={setBody} placeholder="Summary, good quotes, etc."/>
            </HalfContainer>
        </Container>
    )
}