// Builds option sets where every value of every option meets every value of
// every other option at least once. Far fewer cases than all combinations,
// and most bugs where one option breaks another need just those two.
//
// pairwise({ a: [1, 2], b: [true, false] }) -> [{ a: 1, b: true }, ...]
//
// The same input always gives the same cases, so a failing case can be found
// again by its index.
export default function pairwise(values, { tries = 50, seed = 1 } = {}) {
  const keys = Object.keys(values);
  let state = seed;
  // small seeded PRNG (mulberry32)
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const pairKey = (a, i, b, j) => `${a}=${i}|${b}=${j}`;
  const uncovered = new Set();
  keys.forEach((a, ai) =>
    keys
      .slice(ai + 1)
      .forEach((b) =>
        values[a].forEach((_, i) =>
          values[b].forEach((__, j) => uncovered.add(pairKey(a, i, b, j))),
        ),
      ),
  );

  const covers = (indexes) => {
    let count = 0;
    keys.forEach((a, ai) =>
      keys.slice(ai + 1).forEach((b) => {
        if (uncovered.has(pairKey(a, indexes[a], b, indexes[b]))) {
          count += 1;
        }
      }),
    );
    return count;
  };

  const cases = [];
  while (uncovered.size) {
    // start from an uncovered pair, so every case makes progress
    const [first] = uncovered;
    const [[a, i], [b, j]] = first.split('|').map((p) => p.split('='));

    let best;
    let bestCount = -1;
    for (let t = 0; t < tries; t += 1) {
      const indexes = {};
      keys.forEach((key) => {
        indexes[key] = Math.floor(random() * values[key].length);
      });
      indexes[a] = Number(i);
      indexes[b] = Number(j);

      const count = covers(indexes);
      if (count > bestCount) {
        best = indexes;
        bestCount = count;
      }
    }

    keys.forEach((x, xi) =>
      keys
        .slice(xi + 1)
        .forEach((y) => uncovered.delete(pairKey(x, best[x], y, best[y]))),
    );
    cases.push(
      Object.fromEntries(keys.map((key) => [key, values[key][best[key]]])),
    );
  }

  return cases;
}
