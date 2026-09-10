export function extractTags(content: string): string[] {
  const matches = content.match(/#[\w-]+/g);
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
}