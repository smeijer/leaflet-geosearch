import preact, { Component } from 'preact';
import Search from './Search';

class Layout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hash: window.location.hash.slice(1),
    };
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.changePage, false);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.changePage, false);
  }

  changePage = () => {
    this.setState({
      hash: window.location.hash.slice(1),
    });
  };

  render() {
    const { pages } = this.props;
    const { hash } = this.state;
    const page = pages.find(p => p.slug === (hash || 'search'));

    return (
      <div>
        <div className="header">
          <h1>{`GeoSearch / ${page.title}`}</h1>

          <ul>
            {pages.map((p, idx) => (
              <li key={idx} className={p.slug === hash ? 'active' : ''}>
                <a href={`#${p.slug}`}>{p.title}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`content ${hash}`}>
          {page && page.view()}
        </div>
      </div>
    );
  }
}

export default Layout;
