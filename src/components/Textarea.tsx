import classNames from "classnames";
import { Dispatch, SetStateAction } from "react";
import {escape} from "html-escaper";

export default function Textarea({value, setValue, placeholder, className, highlight}: {value: string, setValue: Dispatch<SetStateAction<string>>, placeholder?: string, className?: string, highlight?: string}) {
    const backdropValue = (highlight ? escape(value).replaceAll(highlight, "<mark>$&</mark>") : escape(value)) + "<br/>";

    return (
        <div className={classNames("relative", className)}>
            <textarea value={value} onChange={e => setValue(e.target.value)} className="absolute top-0 left-0 w-full h-full overflow-hidden border resize-none border-none outline-none leading-[1.7] bg-transparent" placeholder={placeholder}></textarea>
            <p className="pointer-events-none whitespace-pre-wrap leading-[1.7]" dangerouslySetInnerHTML={{__html: backdropValue}}></p>
        </div>
    )
}