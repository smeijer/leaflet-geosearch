import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      address: query,
    });

    // google requires a secure connection when using api keys
    const proto = (params && params.key) ? 'https:' : protocol;
    return `${proto}//maps.googleapis.com/maps/api/geocode/json?${paramString}`;
  }

  parse({ data }) {
    return data.results.map(r => ({
      x: r.geometry.location.lng,
      y: r.geometry.location.lat,
      label: r.formatted_address,
      bounds: [
        [r.geometry.viewport.southwest.lat, r.geometry.viewport.southwest.lng], // s, w
        [r.geometry.viewport.northeast.lat, r.geometry.viewport.northeast.lng], // n, e
      ],
      raw: r,
    }));
  }
}
