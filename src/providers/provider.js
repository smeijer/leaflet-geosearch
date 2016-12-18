export default class Provider {
  constructor(options = {}) {
    this.options = options;
  }

  getParamString(params) {
    return Object.keys(params).map(key =>
      `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
    ).join('&');
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
