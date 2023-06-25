import { Dispatch, SetStateAction } from "react";
import { FileContent } from "../App";
import classNames from "classnames";
import { format } from "date-fns";

function dateOnly(date: string): Date {
    const initDate = new Date(date);
    const newDate = new Date(initDate.valueOf() + initDate.getTimezoneOffset() * 60 * 1000);
    return newDate;
}

export default function SidebarFile({ content, selected, setSelected }: { content: FileContent, selected: string, setSelected: Dispatch<SetStateAction<string>> }) {
    const isWebsite = "url" in content;
    const isAudio = "id" in content;
    const isSelected = selected === content.fileName;
    const previewText = isAudio ? null : (isWebsite ? content.body : content.notes);

    return (
        <button
            className={classNames("p-4 block w-full text-left break-all", isSelected ? "bg-white disabled border-t border-b" : "hover:bg-gray-200")}
            onClick={() => setSelected(content.fileName)}
        >
            <p className="text-[9px] uppercase font-bold opacity-50">{isAudio ? "Transcription in progress" : isWebsite ? "Website" : "Interview"} {isWebsite && ` | ${content.pub}`}</p>
            <p className="text-sm line-clamp-2 my-1 leading-tight font-medium">{content.name}</p>
            <p className="text-xs opacity-50 line-clamp-2">{format(dateOnly(content.date), "MMMM d, yyyy") } {!!content.date && !!previewText && " | "} {previewText}</p>
        </button>
    )
}