//import { CollectionConfigMetadata } from "../../standards/edr/types";
interface Options {
	contentTypes: { [key: string]: { type: string; baseUrl?: string } };
}
/*
export class BaseLinkManager {
	url: URL;
	contentTypes: { [x: string]: string };
	HTML_URL?: string;
	default_content_negotiator: string;
	constructor({
		url,
		contentTypes = {
			json: 'application/json',
			geojson: 'application/geo+json',
			yaml: 'text/yaml',
			html: 'text/html'
		},
		default_content_negotiator = 'json',
		HTML_URL
	}: {
		contentTypes: { [x: string]: string };
		default_content_negotiator: string;
		HTML_URL: string;
		url: URL;
	}) {
		this.HTML_URL = HTML_URL;
		this.url = url;
		this.contentTypes = contentTypes;

		this.default_content_negotiator = default_content_negotiator;
	}
  /*
  private selfAlts(){
    const
    self=this.url.searchParams.get('f') || this.default_content_negotiator;
    return{self:Object.entries(this.contentTypes).find(([f,_])=>f===self)}
  }


	private get selfAltLinks(): CommonTypes.Link[] {
		const currentNegotiator = this.url.searchParams.get('f') || this.default_content_negotiator;
		return [{ href: this.url.toJSON(), rel: 'self', type: this.contentTypes[currentNegotiator] },...Object.keys(this.contentTypes).map(c=>({type:this.contentTypes[c],href:this.url.searchParams.set(f,c).}))];
	}
}
*/

//! Links for /collections and /collections.json[*].links
export class LinkManager {
	private readonly _url: URL;
	private readonly _contentType: string;
	options: Options;
	private readonly contentNegotiator: string;
	constructor(url: URL, options: Options) {
		this._url = new URL(url);
		this.contentNegotiator = this._url.searchParams.get('f') || 'json';
		this.options = options;
		this._contentType = this.options.contentTypes[this.contentNegotiator].type;
	}
	get selfAltLinks() {
		let links: CommonTypes.Link[] = [];
		//self link
		links.push({
			href: this._url.toJSON(),
			rel: 'self',
			type: this._contentType
		});
		//Alternates
		Object.entries(this.options.contentTypes).forEach(([k, options]) => {
			var href: string;
			if (options.baseUrl) {
				href = options.baseUrl;
			} else {
				var _tempUrl = new URL(this._url);
				_tempUrl.searchParams.set('f', k);
				href = _tempUrl.toString();
			}
			links.push({ href, type: options.type, rel: 'alternate' });
		});
		return links;
	}
	get RootLinks() {
		var links: CommonTypes.Link[] = [...this.selfAltLinks];
		var _tempUrl = new URL(this._url);
		_tempUrl.search = '';
		['conformance', 'api', 'api.html', 'collections'].forEach((loc) => {
			const [rel, type]: [rel: CommonTypes.Link['rel'], string] =
				loc === 'api.html'
					? ['service-doc', 'text/html']
					: loc === 'api'
					? ['service-desc', 'application/**']
					: [loc === 'conformance' ? 'conformance' : 'data', 'application/json'];
			links.push({
				href: _tempUrl.toString() + loc,
				rel,
				type
			});
		});

		return links;
	}
	get ConformanceLinks() {
		return this.selfAltLinks;
	}

	get FeatureCollectionLinks() {
		var links = this.selfAltLinks;
		var offset = parseInt(this._url.searchParams.get('offset') || '0');
		var limit = parseInt(this._url.searchParams.get('limit') || '0');
		/**Previous & Next links */
		['prev', 'next'].forEach((dir) => {
			var pageOffset = dir === 'prev' ? (limit - offset < 0 ? 0 : offset - limit) : offset + limit;
			var href = new URL(this._url);
			href.searchParams.set('offset', `${pageOffset}`);

			links.push({
				href: href.toString(),
				rel: dir as CommonTypes.Link['rel'],
				type: this._contentType
			});
		});

		/** Links to Collection*/
		var _tempUrl = new URL('.', this._url);
		_tempUrl.searchParams.set('f', 'json');
		links.push({
			href: _tempUrl.toString().slice(0, -1),
			rel: 'data',
			type: 'application/json'
		});
		return links;
	}

	get FeatureLinks() {
		var links = this.selfAltLinks,
			_tempUrl = new URL(this._url),
			href: string,
			_tempUrl: URL;
		/**To Collection */
		_tempUrl = this.NavigateLink(this._url, '..');
		_tempUrl.searchParams.set('f', 'json');

		href = _tempUrl.toString().slice(0, -1);
		links.push({
			href,
			rel: 'data',
			type: 'application/json'
		});
		/**Link to Items */
		_tempUrl = this.NavigateLink(this._url, '.');
		_tempUrl.searchParams.set('f', 'json');
		href = _tempUrl.toString().slice(0, -1);
		links.push({ href, rel: 'items', type: 'application/json' });
		return links;
	}

	/*
    get ConformanceLinks() {
        var links: CommonTypes.Link[] = [];
        ["application/json"].forEach(type => links.push({
            href: this._url.toString(),
            rel: ""
        }))
    }
    */
	/**
	 *
	 * @param url
	 * @param depth something similar to directory navigation
	 */
	NavigateLink(url: URL, depth: string) {
		return new URL(depth, url);
	}
}
