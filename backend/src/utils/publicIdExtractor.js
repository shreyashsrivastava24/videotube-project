const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/upload/")[1]; // v12345/folder/name.ext
  if (!parts) return null;
  const withoutVersion = parts.replace(/^v\d+\//, ""); // folder/name.ext
  const lastDotIndex = withoutVersion.lastIndexOf(".");
  return lastDotIndex !== -1 ? withoutVersion.substring(0, lastDotIndex) : withoutVersion; // remove extension safely
};

export { getPublicIdFromUrl };