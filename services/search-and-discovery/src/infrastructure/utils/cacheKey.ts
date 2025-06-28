import stableStringify from "json-stable-stringify";

export function makeSearchKey(
  type: "artisan" | "service",
  keyword: string,
  filters: Record<string, unknown>,
  page: number,
  limit: number
) {
  return (
    `${type}:search:v1:` +
    `${encodeURIComponent(keyword.toLowerCase().trim())}:` +
    `${stableStringify(filters)}:` +
    `${page}:${limit}`
  );
}
