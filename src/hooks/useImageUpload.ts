import { useState, useRef } from "react";

const UPLOAD_URL = "https://functions.poehali.dev/e3309d4e-61c1-408a-8c6c-44d4dea9be12";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!preview) return null;
    setUploading(true);
    try {
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data = await res.json();
      return data.url || null;
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => setPreview(null);

  return { uploading, preview, fileRef, pickFile, onFileChange, uploadImage, clearPreview };
}
