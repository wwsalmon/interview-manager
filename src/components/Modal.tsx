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
                    maxWidth: "400px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    height: "auto",
                }
            }}
        >
            {children}
        </ReactModal>
    )
}