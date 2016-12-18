import BaseProvider from './provider';
import { createScriptElement } from '../domUtils';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol, jsonp } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      query,
      jsonp,
    });

    return `${protocol}//dev.virtualearth.net/REST/v1/Locations?${paramString}`;
  }

  parse({ data }) {
    if (data.resourceSets.length === 0) {
      return [];
    }

    return (data.resourceSets[0].resources).map(r => ({
      x: r.point.coordinates[1],
      y: r.point.coordinates[0],
      label: r.address.formattedAddress,
      bounds: [
        [r.bbox[0], r.bbox[1]], // s, w
        [r.bbox[2], r.bbox[3]], // n, e
      ],
      raw: r,
    }));
  }

  async search({ query }) {
    // eslint-disable-next-line no-bitwise
    const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';

    const jsonp = `BING_JSONP_CB_${Date.now()}`;
    const url = this.endpoint({ query, protocol, jsonp });

    const json = await createScriptElement(url, jsonp);
    return this.parse({ data: json });
  }
}
