/**
 * Join class names, dropping falsy values. Keeps conditional Tailwind classes
 * readable without pulling in a dependency.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}