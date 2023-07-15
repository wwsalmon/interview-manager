import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import { useEffect, useRef, useState } from "react";
import { FileAreaProps } from "./Audio";
import { AreaOfText, Container, HalfContainer, TopbarInput, TopbarLabel } from "./FileArea";

export default function Interview({dir, selected, afterDelete, updateSidebar, isUnsaved, setIsUnsaved}: FileAreaProps) {
    const [name, setName] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [contents, setContents] = useState<{name: string, date: string, body: string, notes: string}>({name: "", date: "", body: "", notes: ""});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const bodyRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);

    const hasUnsaved = (contents.body !== body) || (contents.date !== date) || (contents.notes !== notes) || (contents.name !== name);

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
        if (!(["notes", "body", "name", "date"].every(d => Object.keys(parsed).includes(d)))) return;
    
        setContents({name: parsed.name, date: parsed.date, notes: parsed.notes, body: parsed.body});
        
        setName(parsed.name);
        setDate(parsed.date);
        setNotes(parsed.notes);
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

        await writeTextFile(dir + "/" + selected, JSON.stringify({name, date, body, notes}), {dir: BaseDirectory.Home});

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
                    <TopbarLabel>Name</TopbarLabel>
                    <TopbarInput type="text" value={name} onChange={e => setName(e.target.value)}/>
                    <TopbarLabel>Date</TopbarLabel>
                    <TopbarInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-24"/>
                </>
            )}
            isLoading={isLoading}
            hasUnsaved={hasUnsaved}
            onSave={onSave}
            onDelete={onDelete}
        >
            <HalfContainer borderRight={true} ref={bodyRef}>
                <AreaOfText label="Body" value={body} setValue={setBody} placeholder="Transcript, main content, etc." className="font-mono" containerRef={bodyRef}/>
            </HalfContainer>
            <HalfContainer ref={notesRef}>
                <AreaOfText label="Notes" value={notes} setValue={setNotes} placeholder="Summary, good quotes, etc." containerRef={notesRef}/>
            </HalfContainer>
        </Container>
    )
}