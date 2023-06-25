import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode, useState } from "react";
import Modal from "./Modal";

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

export function HalfContainer({children, borderRight}: {children: ReactNode, borderRight?: boolean}) {
    return (
        <div className={classNames("w-1/2 flex-shrink-0 flex-grow-0 p-8 h-full overflow-auto", borderRight && "border-r")}>
            {children}
        </div>
    )
}

export function AreaLabel({children}: {children: ReactNode}) {
    return (
        <p className="text-xs uppercase font-bold mb-8">{children}</p>
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