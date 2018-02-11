import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      format: 'json',
      q: query,
      language: this.options['accept-language'],
    });

    return `${protocol}//api.opencagedata.com/geocode/v1/json?${paramString}`;
  }

  parse({ data }) {
    return data.results.map(r => ({
      x: r.geometry.lng,
      y: r.geometry.lat,
      label: r.formatted,
      bounds: [
        [parseFloat(r.bounds.southwest.lat), parseFloat(r.bounds.southwest.lng)], // s, w
        [parseFloat(r.bounds.northeast.lat), parseFloat(r.bounds.northeast.lng)], // n, e
      ],
      raw: r,
    }));
  }

  async search({ query }) {
    // eslint-disable-next-line no-bitwise
    const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';
    const url = this.endpoint({ query, protocol });

    const request = await fetch(url);
    const json = await request.json();
    return this.parse({ data: json });
  }
}
