import PeliasProvider, { PeliasProviderOptions } from './peliasProvider';

export default class GeocodeEarthProvider extends PeliasProvider {
  constructor(options: PeliasProviderOptions = {}) {
    options.host = 'https://api.geocode.earth';
    super(options);
  }
}
