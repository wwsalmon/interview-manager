import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import fm from "front-matter";
import { useEffect, useState } from "react";
import Textarea from "./Textarea";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import makeLinkFile from "../utils/makeLinkFile";

export default function Website({dir, selected}: {dir: string, selected: string}) {
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

    return (
        <div className="h-screen flex flex-col border-l border-t">
            <div className="px-4 flex items-center h-12 flex-shrink-0 border-b">
                <label className="text-xs uppercase font-bold mr-2">URL</label>
                <a href={url} target="_blank" className="mr-4 text-sm underline truncate w-32">{url}</a>
                <label className="text-xs uppercase font-bold mr-2">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mr-4 text-sm border p-1"/>
                <label className="text-xs uppercase font-bold mr-2">Pub</label>
                <input type="text" value={pub} onChange={e => setPub(e.target.value)} className="mr-4 text-sm border p-1"/>
                <label className="text-xs uppercase font-bold mr-2">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mr-4 text-sm border p-1"/>
            </div>  
            <div className="flex flex-grow-1" style={{height: "calc(100vh - 96px)"}}>
                <div className="w-1/2 flex-shrink-0 flex-grow-0 border-r h-full overflow-hidden">
                    <iframe src={url} className="w-[133%] h-[133%] transform scale-75 origin-top-left"></iframe>
                </div>
                <div className="w-1/2 flex-shrink-0 flex-grow-0 p-8 h-full overflow-auto">
                    <p className="text-xs uppercase font-bold mb-8">Notes</p>
                    <Textarea value={body} setValue={setBody} placeholder="Summary, good quotes, etc."/>
                </div>
            </div>
            <div className="h-12 border-t w-full flex items-center px-4 flex-shrink-0">
                <button disabled={!hasUnsaved || isLoading} onClick={onSave} className="px-4 py-1 text-sm text-white bg-gray-800 disabled:opacity-50">Save (Cmd + S)</button>
                <p className={classNames("text-sm ml-4", (!isLoading && hasUnsaved) ? "text-red-500" : "opacity-50")}>{isLoading ? "Saving..." : hasUnsaved ? "Unsaved changes" : "All changes saved"}</p>
            </div>
        </div>
    )
}