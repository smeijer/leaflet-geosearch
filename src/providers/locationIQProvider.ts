import OpenStreetMapProvider, {
  OpenStreetMapProviderOptions,
} from './openStreetMapProvider';

export default class LocationIQProvider extends OpenStreetMapProvider {
  constructor(options: OpenStreetMapProviderOptions) {
    super({
      ...options,
      searchUrl: `https://locationiq.org/v1/search.php`,
      reverseUrl: `https://locationiq.org/v1/reverse.php`,
    });
  }
}
