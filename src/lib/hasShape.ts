export default function hasShape(
  keys: string[],
  exact: boolean,
  object: object,
): boolean {
  if (exact && keys.length !== Object.keys(object).length) {
    return false;
  }

  if (exact && keys.some((x) => !object.hasOwnProperty(x))) {
    return false;
  }

  if (!keys.some((x) => object.hasOwnProperty(x))) {
    return false;
  }

  return true;
}
