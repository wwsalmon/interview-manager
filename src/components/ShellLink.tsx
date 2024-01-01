import {open} from "@tauri-apps/api/shell";
import { HTMLAttributes } from "react";

export default function ShellLink(props: HTMLAttributes<HTMLButtonElement> & {href: string}) {
    let domProps: any = {...props};
    delete domProps.href;

    return (
        <button onClick={() => open(props.href)} {...domProps}>
            {props.children}
        </button>
    )
}