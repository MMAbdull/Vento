const generateSlug = (title, id) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `${baseSlug}-${id.slice(-3)}`;
};

module.exports = generateSlug;