import preact, { Component } from 'preact';
import merge from 'lodash.merge';
import {
  GeoSearchControl,
  OpenStreetMapProvider,
  Provider as BaseProvider,
} from '../../src';

const L = window.L;

// eslint-disable-next-line no-confusing-arrow
const ensureInstance = Provider => Provider instanceof BaseProvider ? Provider : new Provider();

const mapOptions = () => ({
  layers: [
    new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }),
  ],
  center: new L.LatLng(53.2, 5.8),
  zoom: 12,
});

class Map extends Component {
  componentDidMount() {
    const { options, Provider } = this.props;

    this.map = new L.Map(this.container, merge(mapOptions(), options));

    const provider = (Provider) ? ensureInstance(Provider) : new OpenStreetMapProvider();

    this.searchControl = new GeoSearchControl({
      provider,
    }).addTo(this.map);
  }

  componentDidUpdate() {
    const Provider = this.props.Provider || OpenStreetMapProvider;
    this.searchControl.options.provider = ensureInstance(Provider);
  }

  componentWillUnmount() {
    this.map.remove();
  }

  bindContainer = (container) => {
    this.container = container;
  };

  render() {
    const { style } = this.props;

    return (
      <div className="leaflet-map" style={style} ref={this.bindContainer} />
    );
  }
}

export default Map;
