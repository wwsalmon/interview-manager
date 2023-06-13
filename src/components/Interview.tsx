import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import fm from "front-matter";
import { useEffect, useState } from "react";
import Textarea from "./Textarea";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import makeFile from "../utils/makeFile";

export default function Interview({dir, selected}: {dir: string, selected: string}) {
    const [name, setName] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [contents, setContents] = useState<{name: string, date: string, body: string, notes: string}>({name: "", date: "", body: "", notes: ""});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const hasUnsaved = (contents.body !== body) || (contents.date !== date) || (contents.notes !== notes) || (contents.name !== name);

    useEffect(() => {
        onLoad();
    }, []);

    async function onLoad() {
        const content = await readTextFile(dir + "/" + selected, {dir: BaseDirectory.Home});
    
        const parsed = fm(content);
        const attributes = parsed.attributes as {[key: string]: string};
    
        if (!(attributes.name && attributes.date && "notes" in attributes)) return;
    
        setContents({name: attributes.name, date: attributes.date, notes: attributes.notes, body: parsed.body});
        
        setName(attributes.name);
        setDate(attributes.date);
        setNotes(attributes.notes);
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

        console.log(makeFile(name, date, body, notes));

        await writeTextFile(dir + "/" + selected, makeFile(name, date, body, notes), {dir: BaseDirectory.Home});

        await onLoad();

        setIsLoading(false);
        setIsSaving(false);
    }

    return (
        <div className="h-screen flex flex-col border-l border-t">
            <div className="px-4 flex items-center h-12 flex-shrink-0 border-b">
                <label className="text-xs uppercase font-bold mr-2">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mr-4 text-sm border p-1"/>
                <label className="text-xs uppercase font-bold mr-2">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mr-4 text-sm border p-1"/>
            </div>  
            <div className="flex px-8 flex-grow-1" style={{height: "calc(100vh - 96px)"}}>
                <div className="w-1/2 flex-shrink-0 flex-grow-0 pr-8 border-r h-full overflow-auto">
                    <p className="text-xs uppercase font-bold my-8">Body</p>
                    <Textarea value={body} setValue={setBody} placeholder="Transcript, main content, etc."/>
                </div>
                <div className="w-1/2 flex-shrink-0 flex-grow-0 pl-8 h-full overflow-auto">
                    <p className="text-xs uppercase font-bold my-8">Notes</p>
                    <Textarea value={notes} setValue={setNotes} placeholder="Summary, good quotes, etc."/>
                </div>
            </div>
            <div className="h-12 border-t w-full flex items-center px-4 flex-shrink-0">
                <button disabled={!hasUnsaved || isLoading} onClick={onSave} className="px-4 py-1 text-sm text-white bg-gray-800 disabled:opacity-50">Save (Cmd + S)</button>
                <p className={classNames("text-sm ml-4", (!isLoading && hasUnsaved) ? "text-red-500" : "opacity-50")}>{isLoading ? "Saving..." : hasUnsaved ? "Unsaved changes" : "All changes saved"}</p>
            </div>
        </div>
    )
}