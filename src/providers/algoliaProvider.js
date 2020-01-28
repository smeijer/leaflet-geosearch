import BaseProvider from './provider';

export default class Provider extends BaseProvider {

  endpoint({ protocol }) {
    // No query, Algolia requires POST request
    return `${protocol}//places-dsn.algolia.net/1/places/query`;
  }

  /**
   * Replacement for query parameters
   * Algolia requires POST request
   */
  buildData({ query }) {
    // Set query and bypass provider options
    return JSON.stringify({
      ...this.options,
      query,
    });
  }

  /**
   * Algolia not provides labels for hits, so
   * we will implement that builder ourselves
   */
  buildLabel(r) {
    const stringBuilder = [];
    // Building + Street
    if (r.locale_names) {
      stringBuilder.push(r.locale_names.default);
    }
    // City
    if (r.city) {
      stringBuilder.push(r.city.default);
    }
    // State
    if (r.administrative) {
      stringBuilder.push(r.administrative[0]);
    }
    // Zip code
    if (r.postcode) {
      stringBuilder.push(r.postcode[0]);
    }
    // Country
    if (r.country) {
      stringBuilder.push(r.country.default);
    }
    // Build label
    return stringBuilder.join(', ');
  }

  parse({ data }) {
    return data.hits.map(r => ({
      x: r._geoloc.lng,
      y: r._geoloc.lat,
      label: this.buildLabel(r),
      bounds: null,  // Algolia API does not provide bounds
      raw: r,
    }));
  }

  async search({ query }) {
    // eslint-disable-next-line no-bitwise
    const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';
    // Get url
    const url = this.endpoint({ protocol });
    // Build POST data
    const data = this.buildData({ query });
    // Request
    const request = await fetch(url, {
      method: 'POST',
      body: data,
    });
    const json = await request.json();
    // Parse and return results
    return this.parse({ data: json });
  }
}
