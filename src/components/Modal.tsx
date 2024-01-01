import { Dispatch, ReactNode, SetStateAction } from "react";
import ReactModal from "react-modal";

export default function Modal({ children, isOpen, setIsOpen }: { children: ReactNode, isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>> }) {
    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            style={{
                overlay: {
                    backgroundColor: "rgba(0,0,0,0.5)",
                },
                content: {
                    width: "400px",
                    maxWidth: "100%",
                    inset: "50% auto auto 50%",
                    transform: "translate(-50%, -50%)",
                    height: "auto",
                }
            }}
        >
            {children}
        </ReactModal>
    )
}