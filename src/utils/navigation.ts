/**
 * Leaving the page, or loading it again.
 *
 * These go through here because they're what a test can't do for real:
 * browsers don't let `location` be stood in for, and it would take the test
 * away with the page.
 */
export const navigation = {
  assign: (url: URL | string): void => {
    location.assign(url);
  },
  replace: (url: string): void => {
    location.replace(url);
  },
  reload: (): void => {
    location.reload();
  }
};
