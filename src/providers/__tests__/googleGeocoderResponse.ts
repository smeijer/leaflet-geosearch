const geocoderGeocoderResponse: google.maps.GeocoderResult = {
  address_components: [
    {
      long_name: '1',
      short_name: '1',
      types: ['street_number'],
    },
    {
      long_name: 'George Maduroplein',
      short_name: 'George Maduroplein',
      types: ['route'],
    },
    {
      long_name: 'Scheveningen',
      short_name: 'Scheveningen',
      types: ['political', 'sublocality', 'sublocality_level_1'],
    },
    {
      long_name: 'Den Haag',
      short_name: 'Den Haag',
      types: ['locality', 'political'],
    },
    {
      long_name: 'Den Haag',
      short_name: 'Den Haag',
      types: ['administrative_area_level_2', 'political'],
    },
    {
      long_name: 'Zuid-Holland',
      short_name: 'ZH',
      types: ['administrative_area_level_1', 'political'],
    },
    {
      long_name: 'Netherlands',
      short_name: 'NL',
      types: ['country', 'political'],
    },
    {
      long_name: '2584 RZ',
      short_name: '2584 RZ',
      types: ['postal_code'],
    },
  ],
  formatted_address: 'George Maduroplein 1, 2584 RZ Den Haag, Netherlands',
  geometry: {
    location: {
      toJSON: () => {
        return {
          lat: 52.0994757,
          lng: 4.2969304,
        } as google.maps.LatLngLiteral;
      },
    } as google.maps.LatLng,
    location_type: 'ROOFTOP' as google.maps.GeocoderLocationType.ROOFTOP,
    viewport: {
      toJSON: () => {
        return {
          north: 52.1008246802915,
          east: 4.298279380291502,
          south: 52.0981267197085,
          west: 4.295581419708498,
        } as google.maps.LatLngBoundsLiteral;
      },
    } as google.maps.LatLngBounds,
  },
  place_id: 'ChIJx9INHE23xUcRQLyRyK-B_sw',
  types: [
    'amusement_park',
    'establishment',
    'point_of_interest',
    'tourist_attraction',
  ],
};

export default geocoderGeocoderResponse;
