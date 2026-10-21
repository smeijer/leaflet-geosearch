import { useEffect, useMemo, useState } from 'react';
import { createProvider, ProviderName } from './providers';
import styles from './Search.module.css';

interface SearchProps {
  provider?: ProviderName;
}

// a provider without Leaflet: a text field and a list of results
export default function Search({ provider = 'OpenStreetMap' }: SearchProps) {
  const instance = useMemo(() => createProvider(provider), [provider]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string }[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      instance
        .search({ query, signal: controller.signal })
        .then((found) => setResults(found.slice(0, 5)))
        .catch(() => setResults([]));
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [instance, query]);

  return (
    <div className={styles.search}>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className={styles.result}>
        {results.map((result, idx) => (
          <div key={idx}>{result.label}</div>
        ))}
      </div>
    </div>
  );
}
