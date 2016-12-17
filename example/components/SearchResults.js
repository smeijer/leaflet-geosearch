import preact from 'preact';

const SearchResults = ({ results = [], selected }) => (
  <div className="results">
    {results.map((result, idx) => (
      <div className={idx === selected ? 'active' : ''}>{result.label}</div>
    ))}
  </div>
);

export default SearchResults;
