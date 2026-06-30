export const objectsToCSV = (rows, columns) => {
  const header = columns.map((c) => c.header).join(',');
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = rows.map((row) =>
    columns.map((col) => escape(typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])).join(',')
  );

  return [header, ...lines].join('\n');
};

export default objectsToCSV;
