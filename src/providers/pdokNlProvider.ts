import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  SearchResult,
  RequestType,
  SearchArgument,
} from './provider';

interface Doc {
  weergavenaam: string;
  id: string;
  centroide_ll: string;
}

export interface RequestResult {
  response: {
    numFound: number;
    start: number;
    maxScore: number;
    numFoundExact: boolean;
    docs: Doc[];
  };
  highlighting: {
    [key: string]: {
      suggest: string[];
    };
  };
  spellcheck: {
    suggestions: [
      string,
      {
        numFound: number;
        startOffset: number;
        endOffset: number;
        suggestion: string[];
      },
    ];
    collations: [
      'collation',
      {
        collationQuery: string;
        hits: number;
        misspellingsAndCorrections: string[];
      },
    ];
  };
}

export interface RawResult extends Doc {
  highlight: string;
}

export type PdokNlProviderOptions = ProviderOptions;

export default class PdokNlProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl: string;
  reverseUrl: string;

  constructor(options: PdokNlProviderOptions = {}) {
    super({
      ...options,
      params: {
        bq: 'type:gemeente^0.5 type:woonplaats^0.5 type:weg^1.0 type:postcode^1.5 type:adres^2.0',
        fl: 'id,weergavenaam,centroide_ll',
        rows: 5,
        ...options.params,
      },
    });

    const base = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';
    this.searchUrl = `${base}/suggest`;
    this.reverseUrl = `${base}/reverse`;
  }

  endpoint({ query, type }: EndpointArgument) {
    const params = typeof query === 'string' ? { q: query } : query;

    switch (type) {
      case RequestType.REVERSE:
        return this.getUrl(this.reverseUrl, params);

      default:
        return this.getUrl(this.searchUrl, params);
    }
  }

  parse({ data }: ParseArgument<RequestResult>) {
    return data.response.docs.map((doc) => {
      const position = doc.centroide_ll
        .replace(/POINT\(|\)/g, '')
        .trim()
        .split(' ')
        .map(Number);

      let highlight = doc.weergavenaam;
      if (data.highlighting[doc.id].suggest) {
        highlight = data.highlighting[doc.id].suggest[0];
      }

      return {
        x: position[0],
        y: position[1],
        label: doc.weergavenaam,
        bounds: null,
        raw: {
          ...doc,
          highlight,
        },
      };
    });
  }

  async search(options: SearchArgument): Promise<SearchResult<RawResult>[]> {
    const url = this.endpoint({
      query: options.query,
    });

    const json = await fetch(url)
      .then((response) => response.json())
      .then((json: RequestResult) => {
        // If there are no results found but there are spellcheck corrections, we search again using the corrected query.
        if (json.response.numFound < 1) {
          if (json.spellcheck.collations.length >= 2) {
            const url = this.endpoint({
              query: json.spellcheck.collations[1].collationQuery,
            });

            return fetch(url).then(
              (response): Promise<RequestResult> => response.json(),
            );
          }
        }

        return json;
      });

    return this.parse({ data: json });
  }
}
