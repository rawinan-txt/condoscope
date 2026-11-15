/** Scroll past the intro to the home page's search box and put the cursor in its first field (the box is below the story, never on top of it). */
export function skipToSearch(): void {
  const field = document.querySelector<HTMLElement>('[data-home-search]');
  const behavior: ScrollBehavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (field) {
    field.focus({ preventScroll: true });
    field.scrollIntoView({ behavior, block: 'center' });
    return;
  }
  // the search box has not loaded yet: go to the end of the story, where it will appear
  const end = document.querySelector<HTMLElement>('[data-intro]');
  if (end) window.scrollTo({ top: end.offsetTop + end.offsetHeight, behavior });
}
