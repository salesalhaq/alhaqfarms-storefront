export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

/**
 * Resize and re-encode a customer receipt to a JPEG that fits the upload limit.
 * Shared by checkout and the "upload a new receipt" flow on order tracking.
 */
export function compressReceipt(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, or WebP receipt image."));
  }
  if (file.size > 12 * 1024 * 1024) {
    return Promise.reject(new Error("The selected image is too large to process."));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (
        image.naturalWidth > 6000 ||
        image.naturalHeight > 6000 ||
        image.naturalWidth * image.naturalHeight > 40_000_000
      ) {
        reject(new Error("The receipt image dimensions are too large to process."));
        return;
      }
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("The receipt image could not be processed."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The receipt image could not be compressed."));
            return;
          }
          if (blob.size > MAX_RECEIPT_BYTES) {
            reject(new Error("The compressed receipt must be no larger than 4 MB."));
            return;
          }
          resolve(new File([blob], "receipt.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a readable image."));
    };
    image.src = objectUrl;
  });
}
