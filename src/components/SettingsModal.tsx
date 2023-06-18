import { Dispatch, SetStateAction, useState } from "react";
import { ModalInput, ModalLabel, Settings } from "../App";
import Modal from "./Modal";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

export default function SettingsModal({isSettings, setIsSettings, settings, setSettings}: {isSettings: boolean, setIsSettings: Dispatch<SetStateAction<boolean>>, settings: Settings, setSettings: Dispatch<SetStateAction<Settings>>}) {
    const [revKey, setRevKey] = useState<string>(settings.revKey);
    const [isSettingLoading, setIsSettingLoading] = useState<boolean>(false);

    const unsavedSettings = settings.revKey !== revKey;

    async function onSave(newSettings: Settings) {
        if (isSettingLoading) return;
    
        setIsSettingLoading(true);
    
        await writeTextFile("settings.json", JSON.stringify(newSettings), {dir: BaseDirectory.AppConfig});
    
        setSettings(newSettings);
    
        setIsSettingLoading(false);
    }
  
    async function onSaveRevKey() {
      let newSettings = {...settings};
  
      newSettings.revKey = revKey;

      onSave(newSettings);
    }

    async function onClearRecent() {
        let newSettings = {...settings};
    
        newSettings.recent = [];

        onSave(newSettings);
    }

    return (
        <Modal isOpen={isSettings} setIsOpen={setIsSettings}>
            <p className="text-center font-bold mb-6">Settings</p>
            <ModalLabel>rev.ai API Key</ModalLabel>
            <p className="my-2 text-sm opacity-50">rev.ai is the transcription service used by SZH Interview Manager. The transcription service has a small cost ($0.02/minute), so to keep Interview Manager free, you have to bring your own key to use transcription. Go to <a href="https://rev.ai/" className="underline" target="_blank">rev.ai</a> to make an account and get an API key, then put it below to use transcription.</p>
            <ModalInput value={revKey} onChange={e => setRevKey(e.target.value)} placeholder="ex. ABCDE"/>
            <button
            className="w-full bg-gray-800 p-2 text-white mt-auto disabled:opacity-50"
            disabled={!unsavedSettings}
            onClick={onSaveRevKey}
            >Save key</button>
            <ModalLabel className="mt-12 mb-6">Recently opened</ModalLabel>
            <button
            className="w-full bg-red-500 p-2 text-white mt-auto disabled:opacity-50"
            disabled={!settings.recent.length}
            onClick={onClearRecent}
            >Clear history</button>
        </Modal>
    )
}