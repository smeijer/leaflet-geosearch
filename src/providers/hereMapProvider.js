import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query, protocol } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      searchtext: query,
      jsonattributes: 1,
    });

    return `${protocol}//geocoder.api.here.com/6.2/geocode.json?${paramString}`;
  }

  parse({ data }) {
    if (data.response.view.length === 0) {
      return [];
    }

    return data.response.view[0].result.map(r => ({
      x: r.location.displayPosition.longitude,
      y: r.location.displayPosition.latitude,
      label: r.location.address.label,
      bounds: [
        [r.location.mapView.bottomRight.latitude, r.location.mapView.topLeft.longitude],   // s, w
        [r.location.mapView.topLeft.latitude, r.location.mapView.bottomRight.longitude],   // n, e
      ],
      raw: r,
    }));
  }
}
