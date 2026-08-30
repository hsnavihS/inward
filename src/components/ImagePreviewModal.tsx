// react
import { useCallback, useEffect } from "react";

interface ImagePreviewModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImagePreviewModal({ src, alt = "preview", onClose }: ImagePreviewModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = alt;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} />
        <div className="image-modal-actions">
          <button onClick={handleDownload}>download</button>
          <button onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  );
}
