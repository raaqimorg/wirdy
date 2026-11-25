export function fullTitle({ title, context }: { title: string; context?: string }): string {
  return context ? `${title} (${context})` : title;
}
