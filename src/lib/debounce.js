export default function debounce(cb, wait, immediate) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);

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
