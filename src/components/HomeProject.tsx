import { message } from "@tauri-apps/api/dialog";
import { exists } from "@tauri-apps/api/fs";
import { Dispatch, SetStateAction } from "react";
import { Settings, updateRecent } from "../App";

export default function HomeProject({thisDir, setDir, setSettings, setSelected}: {thisDir: string, setDir: Dispatch<SetStateAction<string | null>>, setSettings: Dispatch<SetStateAction<Settings | null>>, setSelected: Dispatch<SetStateAction<string>>}) {
    async function onClick() {
        // check that folder exists
        const dirExists = await exists(thisDir);

        if (dirExists) {
            // change dir, clear selected
            setDir(thisDir);
            setSelected("");
            // update recent
            updateRecent(thisDir, setSettings);
        } else {
            await message("This folder no longer exists, and will be removed from the recent folders list.");
            updateRecent(thisDir, setSettings, true);
        }
    }

    return (
        <button className="text-left block mt-6 opacity-50 hover:opacity-100" onClick={onClick}>
            <p className="font-mono text-xs opacity-50">{thisDir.replace(/(^.*?)([^\\\/]*)$/, "$1")}</p>
            <p className="font-semibold">{thisDir.replace(/(^.*?)([^\\\/]*)$/, "$2")}</p>
        </button>
    )
}