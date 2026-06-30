export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    if (field) {
      sort = { [field]: order === 'asc' ? 1 : -1 };
    }
  }

  return { page, limit, skip, sort };
};

export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

export default { getPagination, buildPaginationMeta };
