import preact, { Component } from 'preact';
import merge from 'lodash.merge';
import L from 'leaflet';
import styles from './Map.css';

import {
  GeoSearchControl,
  OpenStreetMapProvider,
  Provider as BaseProvider,
} from '../../src';

// eslint-disable-next-line no-confusing-arrow
const ensureInstance = Provider => Provider instanceof BaseProvider ? Provider : new Provider();

// eslint-disable-next-line no-bitwise
const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';

const mapOptions = () => ({
  layers: [
    new L.TileLayer(`${protocol}//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, {
      maxZoom: 18,
    }),
  ],
  center: new L.LatLng(53.2, 5.8),
  zoom: 12,
});

class Map extends Component {
  componentDidMount() {
    const { options, Provider } = this.props;
    this.map = this.map || new L.Map(this.container, mapOptions());

    const provider = (Provider) ? ensureInstance(Provider) : new OpenStreetMapProvider();

    this.searchControl = new GeoSearchControl({
      ...options,
      provider,
    }).addTo(this.map);

    window.search = this.searchControl;
    window.map = this.map;
  }

  componentDidUpdate() {
    this.map.removeControl(this.searchControl);
    this.componentDidMount();
  }

  componentWillUnmount() {
    this.map.remove();
  }

  bindContainer = (container) => {
    this.container = container;
  };

  render() {
    return (
      <div className={styles.map} ref={this.bindContainer} />
    );
  }
}

export default Map;
