(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{"9OWw":function(e,a,t){"use strict";t.r(a),t.d(a,"_frontmatter",(function(){return l})),t.d(a,"default",(function(){return d}));var o=t("Fcif"),r=t("+I+c"),n=(t("mXGw"),t("/FXl")),p=t("TjRS"),c=t("KUxS"),i=t("yYOO"),s=(t("aD51"),["components"]),l={};void 0!==l&&l&&l===Object(l)&&Object.isExtensible(l)&&!Object.prototype.hasOwnProperty.call(l,"__filemeta")&&Object.defineProperty(l,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"docs/providers/amap.mdx"}});var m={_frontmatter:l},b=p.a;function d(e){var a,t=e.components,d=Object(r.a)(e,s);return Object(n.b)(b,Object(o.a)({},m,d,{components:t,mdxType:"MDXLayout"}),Object(n.b)("h1",{id:"amap-provider"},"AMap Provider"),Object(n.b)("p",null,Object(n.b)("strong",{parentName:"p"},"note"),": AMap services require an API key. ",Object(n.b)("a",{parentName:"p",href:"https://console.amap.com/dev/key/app"},"Obtain here"),".\nFor more options and configurations, see the ",Object(n.b)("a",{parentName:"p",href:"https://lbs.amap.com/api/webservice/guide/api/georegeo"},"AMap developer docs"),"."),Object(n.b)(c.a,{__position:0,__code:'<Map provider="AMap" />',__scope:(a={props:d,DefaultLayout:p.a,Playground:c.a,Map:i.a},a.DefaultLayout=p.a,a._frontmatter=l,a),mdxType:"Playground"},Object(n.b)(i.a,{provider:"AMap",mdxType:"Map"})),Object(n.b)("pre",null,Object(n.b)("code",{parentName:"pre",className:"language-js"},"import { AMapProvider } from 'leaflet-geosearch';\n\nconst provider = new AMapProvider({\n  params: {\n    key: '__YOUR_AMAP_KEY__',\n  },\n});\n\n// add to leaflet\nimport { GeoSearchControl } from 'leaflet-geosearch';\n\nmap.addControl(\n  new GeoSearchControl({\n    provider,\n    style: 'bar',\n  }),\n);\n")))}void 0!==d&&d&&d===Object(d)&&Object.isExtensible(d)&&!Object.prototype.hasOwnProperty.call(d,"__filemeta")&&Object.defineProperty(d,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"docs/providers/amap.mdx"}}),d.isMDXComponent=!0}}]);
//# sourceMappingURL=component---docs-providers-amap-mdx-3fbdedb34c5c0c3deed9.js.map