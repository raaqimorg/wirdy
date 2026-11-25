export function fullTitle({
  title,
  context,
}: {
  readonly title: string;
  readonly context?: string;
}): string {
  return context === undefined ? title : `${title} (${context})`;
}
