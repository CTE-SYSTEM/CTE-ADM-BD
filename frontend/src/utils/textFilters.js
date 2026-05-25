export const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const filterItems = (items, term, getFields) => {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return items;

  return items.filter((item) =>
    getFields(item).some((field) => normalizeText(field).includes(normalizedTerm)),
  );
};
