import { Dispatch, SetStateAction } from "react";
import { FileContent } from "../App";
import classNames from "classnames";
import { format } from "date-fns";
import { confirm } from "@tauri-apps/api/dialog";

function dateOnly(date: string): Date {
    const initDate = new Date(date);
    const newDate = new Date(initDate.valueOf() + initDate.getTimezoneOffset() * 60 * 1000);
    return newDate;
}

export default function SidebarFile({ content, selected, setSelected, isUnsaved, setIsUnsaved }: { content: FileContent, selected: string, setSelected: Dispatch<SetStateAction<string>>, isUnsaved: boolean, setIsUnsaved: Dispatch<SetStateAction<boolean>> }) {
    const isWebsite = "url" in content;
    const isAudio = "id" in content;
    const isSelected = selected === content.fileName;
    const previewText = isAudio ? null : (isWebsite ? content.body : content.notes);

    async function onClick() {
        if (isUnsaved) {
            const confirmed = await confirm("You will lose your changes on this document if you proceed.", {title: "Unsaved changes"})

            if (!confirmed) return;
        }

        setSelected(content.fileName);
    }

    return (
        <button
            className={classNames("p-4 block w-full text-left break-all", isSelected ? "bg-white disabled border-t border-b" : "hover:bg-gray-200")}
            onClick={onClick}
        >
            <p className="text-sm truncate mb-1 leading-tight font-semibold">{content.name}</p>
            <p className="text-xs opacity-50 line-clamp-2">{content.date && format(dateOnly(content.date), "MMMM d, yyyy") } {!!content.date && !!previewText && " | "} {previewText}</p>
        </button>
    )
}