export function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 8192;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function textToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function fileToBase64(file: File): Promise<{ contentBase64: string; byteLength: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(',');
      resolve({ contentBase64: comma >= 0 ? result.slice(comma + 1) : result, byteLength: file.size });
    };
    reader.readAsDataURL(file);
  });
}
