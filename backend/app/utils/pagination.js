const parsePagination = (query, defaults = {}) => {
  const pageRaw = query?.page;
  const limitRaw = query?.limit;

  if (pageRaw !== undefined && (!Number.isInteger(Number(pageRaw)) || Number(pageRaw) < 1)) {
    return { error: "Invalid page. Expected a positive integer", code: "INVALID_PAGE" };
  }

  if (limitRaw !== undefined && (!Number.isInteger(Number(limitRaw)) || Number(limitRaw) < 1)) {
    return { error: "Invalid limit. Expected a positive integer", code: "INVALID_LIMIT" };
  }

  const page = Math.max(1, parseInt(pageRaw ?? defaults.page ?? 1, 10) || 1);
  const limit = Math.max(1, parseInt(limitRaw ?? defaults.limit ?? 10, 10) || 10);
  const hasPagination = pageRaw !== undefined || limitRaw !== undefined;

  return { page, limit, hasPagination };
};

module.exports = {
  parsePagination,
};
