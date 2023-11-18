import OpenStreetMapProvider, {
  OpenStreetMapProviderOptions,
  RawResult,
  RequestResult,
} from './openStreetMapProvider';

interface RequestResultWithError extends RequestResult {
  error?: string;
}
import { ParseArgument, SearchResult } from './provider';

export default class LocationIQProvider extends OpenStreetMapProvider {
  constructor(options: OpenStreetMapProviderOptions) {
    super({
      ...options,
      searchUrl: `https://locationiq.org/v1/search.php`,
      reverseUrl: `https://locationiq.org/v1/reverse.php`,
    });
  }

  parse(
    response: ParseArgument<RequestResultWithError>,
  ): SearchResult<RawResult>[] {
    if (response.data.error) {
      return [];
    }
    return super.parse(response);
  }
}
