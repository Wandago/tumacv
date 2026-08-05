// Converts image files to base64 and sends them to /api/extract-image, which
// uses Gemini's vision model to transcribe CV/résumé content. This exists
// because many iPhone users struggle to find a saved PDF in the Files app —
// but everyone knows how to open Photos or take a picture. Requires the
// person to be signed in (the server route enforces this).
export async function extractImagesToText(files, accessToken) {
  const images = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result; // "data:image/jpeg;base64,AAAA..."
            const commaIdx = result.indexOf(",");
            resolve({ mimeType: file.type, data: result.slice(commaIdx + 1) });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );

  const res = await fetch("/api/extract-image", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ images }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't read those photos.");
  return data.text;
}
