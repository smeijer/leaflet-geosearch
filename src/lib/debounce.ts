/* eslint-disable @typescript-eslint/no-explicit-any */
export default function debounce(
  cb: (...args: any[]) => void,
  wait = 250,
  immediate = false,
): (...args: any[]) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return (...args: any[]): void => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;

      if (!immediate) {
        cb(...args);
      }
    }, wait);

    if (immediate && !timeout) {
      cb(...args);
    }
  };
}
