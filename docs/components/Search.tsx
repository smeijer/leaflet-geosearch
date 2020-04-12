import React, { useState, useEffect, ReactElement } from 'react';
import * as providers from '../../src/providers';
import styles from './Search.module.css';
import { MapProps } from './Map';

interface SearchProps {
  provider: MapProps['provider'];
  providerOptions: MapProps['providerOptions'];
}

function Search(props: SearchProps): ReactElement {
  // @ts-ignore
  const Provider = providers[`${props.provider}Provider`] || providers.OpenStreetMapProvider;
  const provider = new Provider(props.providerOptions || {});

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    provider.search({ query }).then((results: object[]) => setResults(results.slice(0, 5)));
  }, [query]);

  return (
    <div className={styles.search}>
      <form>
        <input type="text" placeholder="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </form>

      <div className={styles.result}>
        {results.map((result, idx) => (
          <div key={idx}>{result.label}</div>
        ))}
      </div>
    </div>
  );
}

export default Search;
