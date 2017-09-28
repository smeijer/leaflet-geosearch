import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      format: 'json',
      q: query,
    });

    return `${protocol}//nominatim.openstreetmap.org/search?${paramString}`;
  }

  endpointReverse({ data, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      format: 'json',
      osm_id: data.raw.osm_id,
      osm_type: this.translateOsmType(data.raw.osm_type),
    });

    return `${protocol}//nominatim.openstreetmap.org/reverse?${paramString}`;
  }

  parse({ data }) {
    return data.map(r => ({
      x: r.lon,
      y: r.lat,
      label: r.display_name,
      bounds: [
        [parseFloat(r.boundingbox[0]), parseFloat(r.boundingbox[2])], // s, w
        [parseFloat(r.boundingbox[1]), parseFloat(r.boundingbox[3])], // n, e
      ],
      raw: r,
    }));
  }

  async search({ query, data }) {
    // eslint-disable-next-line no-bitwise
    const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';
    if (data) {
      const url = this.endpointReverse({ data, protocol });
    } else {
      const url = this.endpoint({ query, protocol });
    }

    const request = await fetch(url);
    const json = await request.json();
    return this.parse({ data: json });
  }

  translateOsmType(osm_type) {
    if (osm_type === "node") {
      return "N";
    }
    if (osm_type === "way") {
      return "W";
    }
    if (osm_type === "relation") {
      return "R";
    }
    return ""; // Unknown
  }
}
