import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import fm from "front-matter";
import { useEffect, useState } from "react";
import Textarea from "./Textarea";
import { listen } from "@tauri-apps/api/event";
import makeFile from "../utils/makeFile";
import { AreaLabel, Container, HalfContainer, TopbarInput, TopbarLabel } from "./FileArea";

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
    }, [dir, selected]);

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
        <Container
            topbar={(
                <>
                    <TopbarLabel>Name</TopbarLabel>
                    <TopbarInput type="text" value={name} onChange={e => setName(e.target.value)}/>
                    <TopbarLabel>Date</TopbarLabel>
                    <TopbarInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-24"/>
                </>
            )}
            isLoading={isLoading}
            hasUnsaved={hasUnsaved}
            onSave={onSave}
        >
            <HalfContainer borderRight={true}>
                <AreaLabel>Body</AreaLabel>
                <Textarea value={body} setValue={setBody} placeholder="Transcript, main content, etc."/>
            </HalfContainer>
            <HalfContainer>
                <AreaLabel>Notes</AreaLabel>
                <Textarea value={notes} setValue={setNotes} placeholder="Summary, good quotes, etc."/>
            </HalfContainer>
        </Container>
    )
}