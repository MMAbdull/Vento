const generateSlug = (title, id) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `${baseSlug}-${id.slice(-3)}`;
};

module.exports = generateSlug;