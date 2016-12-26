import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      f: 'json',
      text: query,
    });

    return `${protocol}//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?${paramString}`;
  }

  parse({ data }) {
    return data.locations.map(r => ({
      x: r.feature.geometry.x,
      y: r.feature.geometry.y,
      label: r.name,
      bounds: [
        [r.extent.ymin, r.extent.xmin], // s, w
        [r.extent.ymax, r.extent.xmax], // n, e
      ],
      raw: r,
    }));
  }
}
