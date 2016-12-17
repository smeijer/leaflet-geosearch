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
    const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    const url = this.endpoint({ query, protocol });

    const request = await fetch(url);
    const json = await request.json();
    return this.parse({ data: json });
  }
}
