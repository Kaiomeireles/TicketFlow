import { useEffect } from "react";
import "./Toast.css";

export default function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className={`toast-container ${type}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
                </span>
                <p>{message}</p>
            </div>
            <button className="toast-close" onClick={onClose}>&times;</button>
        </div>
    );
}
