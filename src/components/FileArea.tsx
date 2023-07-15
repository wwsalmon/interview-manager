import classNames from "classnames";
import { ComponentPropsWithRef, Dispatch, ForwardedRef, ReactNode, RefObject, SetStateAction, forwardRef, useEffect, useState } from "react";
import Modal from "./Modal";
import Textarea from "./Textarea";
import { escape } from "html-escaper";

export function Container({children, topbar, hasUnsaved, isLoading, onSave, onDelete}: {children: ReactNode, topbar: ReactNode, hasUnsaved?: boolean, isLoading: boolean, onSave?: () => any, onDelete: () => any}) {
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    return (
        <div className="h-screen flex flex-col border-l border-t">
            <div className="h-12 flex-shrink-0 border-b overflow-x-auto w-full">
                <div className="flex items-center h-full px-4">
                    {topbar}
                </div>
            </div>
            <div className="flex flex-grow-1" style={{height: "calc(100vh - 96px)"}}>
                {children}
            </div>
            <div className="h-12 border-t w-full flex items-center px-4 flex-shrink-0">
                {onSave && (
                    <>
                        <button disabled={!hasUnsaved || isLoading} onClick={onSave} className="px-4 py-1 text-sm text-white bg-gray-800 disabled:opacity-25">Save (Cmd + S)</button>
                        <p className={classNames("text-sm ml-4", (!isLoading && hasUnsaved) ? "text-red-500" : "opacity-50")}>{isLoading ? "Saving..." : hasUnsaved ? "Unsaved changes" : "All changes saved"}</p>
                    </>
                )}
                <button className="ml-auto text-white bg-red-700 hover:bg-red-500 disabled:opacity-25 text-sm px-4 py-1" onClick={() => setDeleteOpen(true)} disabled={isLoading}>Delete</button>
            </div>
            <Modal isOpen={deleteOpen} setIsOpen={setDeleteOpen}>
                <p className="text-center font-bold">Are you sure you want to delete this file?</p>
                <p className="text-center my-6">This action cannot be undone.</p>
                <button
                    className="w-full bg-red-500 p-2 text-white disabled:opacity-25"
                    onClick={onDelete}
                    disabled={isLoading}
                >{isLoading ? "Loading..." : "Delete"}</button>
                <button
                    className="w-full bg-gray-700 p-2 text-white mt-2 disabled:opacity-25"
                    onClick={() => setDeleteOpen(false)}
                    disabled={isLoading}
                >Cancel</button>
            </Modal>
        </div>
    )
}

interface HalfContainerProps {
    children: ReactNode, borderRight?: boolean
}

export const HalfContainer = forwardRef<HTMLDivElement, HalfContainerProps>(function({children, borderRight}: HalfContainerProps, ref: ForwardedRef<HTMLDivElement>) {
    return (
        <div className={classNames("w-1/2 flex-shrink-0 flex-grow-0 p-8 h-full overflow-auto", borderRight && "border-r")} ref={ref}>
            {children}
        </div>
    )
});

export function AreaLabel({children, className}: {children: ReactNode, className?: string}) {
    return (
        <p className={classNames("text-xs uppercase font-bold", className)}>{children}</p>
    )
}

export function TopbarLabel({children}: {children: ReactNode}) {
    return (
        <label className="text-xs uppercase font-bold mr-2">{children}</label>
    )
}

export function TopbarInput(props: ComponentPropsWithRef<"input">) {
    let domProps = {...props};
    delete domProps.className;

    return (
        <input {...domProps} className={classNames("mr-4 text-sm border p-1 flex-shrink-0", props.className)}/>
    )
}

export function AreaOfText({label, value, setValue, placeholder, className, containerRef}: {label: string, value: string, setValue: Dispatch<SetStateAction<string>>, placeholder: string, className?: string, containerRef: RefObject<HTMLDivElement>}) {
    const [isFind, setIsFind] = useState<boolean>(false);
    const [findString, setFindString] = useState<string>("");
    const [findIndex, setFindIndex] = useState<number>(0);

    const numMatches = findString ? escape(value).split(findString).length - 1 : 0;

    useEffect(() => {
        setFindIndex(0);
        updateHighlight(0);
    }, [findString]);

    function onFindEnter() {
        const newIndex = (findIndex + 1) % numMatches;
        setFindIndex(newIndex);
        updateHighlight(newIndex);
    }

    function updateHighlight(index: number) {
        if (numMatches && containerRef.current) {
            const matches = containerRef.current.querySelectorAll("mark");

            matches.forEach(d => {
                d.className = "";
                d.classList.add("bg-yellow-100");
            });

            const thisMatch = matches[index];

            if (thisMatch) {
                thisMatch.className = "";
                thisMatch.classList.add("bg-yellow-400");
                const thisTop = thisMatch.offsetTop;
                containerRef.current.scrollTop = thisTop;
            }
        }
    }

    function onToggleFind() {
        if (isFind) {
            setIsFind(false);
        } else {
            setIsFind(true);
            setFindIndex(0);
            updateHighlight(0);
        }
    }

    return (
        <>
            <div className="flex items-center mb-8 sticky -top-8 bg-white z-10 h-10">
                <AreaLabel>{label}</AreaLabel>
                <div className="flex items-center ml-auto">
                    {isFind && (
                        <>
                            {findString && (
                                <span className="text-xs mr-2 whitespace-nowrap opacity-50">{!!numMatches && (findIndex + 1) + "/"}{numMatches} match{numMatches !== 1 && "es"}</span>
                            )}
                            <input type="text" className="border p-1 w-full mr-2 text-sm" placeholder="Find in body" value={findString} onChange={e => setFindString(e.target.value)} onKeyDown={e => {
                                if (e.key === "Enter") onFindEnter();
                            }}/>
                        </>
                    )}
                    <button className="text-xs px-1 py-[2px] rounded border opacity-25 hover:opacity-50" onClick={onToggleFind}>{isFind ? "Close" : "Find"}</button>
                </div>
            </div>
            <Textarea value={value} setValue={setValue} placeholder={placeholder} className={className} highlight={isFind ? findString : ""}/>
        </>
    )
}