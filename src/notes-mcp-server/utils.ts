export const parseCursor = (cursor?: string): number => {
  if (cursor) {
    const decoded = Buffer.from(cursor, "base64").toString();
    const parsed = parseInt(decoded, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};
