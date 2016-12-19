import preact, { Component } from 'preact';
import debounce from 'lodash.debounce';
import * as providers from '../../src/providers';
import SearchResults from './SearchResults';
import styles from './Search.css';

const specialKeys = ['ArrowDown', 'ArrowUp', 'Escape'];

class Search extends Component {
  constructor(props) {
    super(props);

    const Provider = providers[`${props.provider}Provider`] ||
      providers.OpenStreetMapProvider;

    this.provider = new Provider();
  }

  onSubmit = async (event) => {
    event.preventDefault();
    const { query } = this.state;

    const results = await this.provider.search({ query });
    this.setState({
      results,
    });
  };

  onKeyUp = (event) => {
    if (specialKeys.includes(event.code)) {
      return;
    }

    const query = event.target.value;

    this.setState({
      query,
    });

    this.autoSearch(event);
  };

  onKeyDown = (event) => {
    if (event.code === 'Escape') {
      this.reset();
      return;
    }

    if (event.code !== 'ArrowDown' && event.code !== 'ArrowUp') {
      return;
    }

    event.preventDefault();

    const { selected = -1, results } = this.state;
    const max = results.length - 1;

    // eslint-disable-next-line no-bitwise
    const next = (event.code === 'ArrowDown') ? ~~selected + 1 : ~~selected - 1;
    // eslint-disable-next-line no-nested-ternary
    const idx = (next < 0) ? max : (next > max) ? 0 : next;

    this.setState({
      selected: idx,
      query: results[idx].label,
    });
  };

  onFocus = () => {
    this.setState({ isActive: true });
  };

  onBlur = () => {
    this.setState({ isActive: false });
  };

  autoSearch = debounce((event) => {
    this.onSubmit(event);
  }, 250);

  reset() {
    this.setState({
      results: [],
      selected: -1,
      query: '',
    });
  }

  render() {
    const { results, selected, query, isActive } = this.state;

    const className = [
      styles.search,
      (isActive ? 'active' : ''),
    ].join(' ').trim();

    return (
      <div className={className}>
        <form onSubmit={this.onSubmit}>
          <input
            onKeyUp={this.onKeyUp}
            onKeyDown={this.onKeyDown}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            type="text"
            placeholder="search"
            value={query}
          />
        </form>

        {results &&
          <SearchResults results={results} selected={selected} />
        }
      </div>
    );
  }
}

export default Search;
