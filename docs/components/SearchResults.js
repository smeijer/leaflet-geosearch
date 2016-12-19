import preact from 'preact';
import styles from './SearchResults.css';

const SearchResults = ({ results = [], selected }) => (
  <div className={styles.item}>
    {results.map((result, idx) => (
      <div className={idx === selected && 'active'}>{result.label}</div>
    ))}
  </div>
);

export default SearchResults;
