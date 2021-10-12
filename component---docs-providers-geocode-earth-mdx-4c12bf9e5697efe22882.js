(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{iwLz:function(e,t,r){"use strict";r.r(t),r.d(t,"_frontmatter",(function(){return s})),r.d(t,"default",(function(){return d}));r("5hJT"),r("W1QL"),r("K/PF"),r("t91x"),r("75LO"),r("PJhk");var o=r("/FXl"),n=r("TjRS"),a=r("KUxS"),c=r("yYOO");r("aD51");function i(){return(i=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(e[o]=r[o])}return e}).apply(this,arguments)}var s={};void 0!==s&&s&&s===Object(s)&&Object.isExtensible(s)&&!s.hasOwnProperty("__filemeta")&&Object.defineProperty(s,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"docs/providers/geocode-earth.mdx"}});var p={_frontmatter:s},l=n.a;function d(e){var t,r=e.components,d=function(e,t){if(null==e)return{};var r,o,n={},a=Object.keys(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,["components"]);return Object(o.b)(l,i({},p,d,{components:r,mdxType:"MDXLayout"}),Object(o.b)("h1",{id:"geocode-earth-provider"},"Geocode Earth Provider"),Object(o.b)("p",null,"Geocode Earth is a hosted version of the Pelias provider run by the core maintainers of the FOSS project."),Object(o.b)("p",null,Object(o.b)("strong",{parentName:"p"},"note"),": Geocode Earth services require an API key. Grab a ",Object(o.b)("a",i({parentName:"p"},{href:"https://geocode.earth/"}),"free trial key")," from their website."),Object(o.b)("p",null,"For more options and configurations, see the service ",Object(o.b)("a",i({parentName:"p"},{href:"https://geocode.earth/docs/"}),"documentation"),"."),Object(o.b)(a.a,{__position:0,__code:'<Map provider="GeocodeEarth" />',__scope:(t={props:d,DefaultLayout:n.a,Playground:a.a,Map:c.a},t.DefaultLayout=n.a,t._frontmatter=s,t),mdxType:"Playground"},Object(o.b)(c.a,{provider:"GeocodeEarth",mdxType:"Map"})),Object(o.b)("pre",null,Object(o.b)("code",i({parentName:"pre"},{className:"language-js"}),"import { GeocodeEarthProvider } from 'leaflet-geosearch';\n\n// grab an API key from https://geocode.earth\nconst provider = new GeocodeEarthProvider({\n  params: {\n    api_key: '__YOUR_GEOCODE_EARTH_KEY__',\n  },\n});\n\n// add to leaflet\nimport { GeoSearchControl } from 'leaflet-geosearch';\n\nmap.addControl(\n  new GeoSearchControl({\n    provider,\n  }),\n);\n")),Object(o.b)("h2",{id:"optional-parameters"},"Optional parameters"),Object(o.b)("p",null,"Geocode Earth supports a wide range of number of ",Object(o.b)("a",i({parentName:"p"},{href:"https://geocode.earth/docs/"}),"optional parameters")," which can be applied to every request using the ",Object(o.b)("inlineCode",{parentName:"p"},"params")," object:"),Object(o.b)("pre",null,Object(o.b)("code",i({parentName:"pre"},{className:"language-js"}),"const provider = new GeocodeEarthProvider({\n  params: {\n    size: 5, // limit the total number of results returned\n    lang: 'nl', // render results in Dutch\n    'boundary.country': 'NL', // limit search results to the Netherlands\n    layers: 'address,street', // limmit which layers are queried\n  },\n});\n")),Object(o.b)("p",null,"Or individually on a per-request basis:"),Object(o.b)("pre",null,Object(o.b)("code",i({parentName:"pre"},{className:"language-js"}),"const results = await provider.search({\n  query: {\n    text: 'example',\n    'focus.point.lat': 1.11, // score results nearer to the focus point higher\n    'focus.point.lon': 2.22,\n  },\n});\n")))}void 0!==d&&d&&d===Object(d)&&Object.isExtensible(d)&&!d.hasOwnProperty("__filemeta")&&Object.defineProperty(d,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"docs/providers/geocode-earth.mdx"}}),d.isMDXComponent=!0}}]);
//# sourceMappingURL=component---docs-providers-geocode-earth-mdx-4c12bf9e5697efe22882.js.map