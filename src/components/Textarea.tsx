import classNames from "classnames";
import { Dispatch, SetStateAction } from "react";

export default function Textarea({value, setValue, placeholder, className}: {value: string, setValue: Dispatch<SetStateAction<string>>, placeholder?: string, className?: string}) {
    return (
        <div className={classNames("relative", className)}>
            <textarea value={value} onChange={e => setValue(e.target.value)} className="absolute top-0 left-0 w-full h-full overflow-hidden border resize-none border-none outline-none leading-[1.7]" placeholder={placeholder}></textarea>
            <p className="invisible whitespace-pre-line leading-[1.7]">{value}<br/></p>
        </div>
    )
}