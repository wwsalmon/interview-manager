import { Dispatch, SetStateAction } from "react";

export default function Textarea({value, setValue, placeholder}: {value: string, setValue: Dispatch<SetStateAction<string>>, placeholder?: string}) {
    return (
        <div className="relative">
            <textarea value={value} onChange={e => setValue(e.target.value)} className="absolute text-sm top-0 left-0 w-full h-full overflow-hidden border resize-none border-none outline-none" placeholder={placeholder}></textarea>
            <p className="invisible whitespace-pre-line text-sm">{value}<br/></p>
        </div>
    )
}