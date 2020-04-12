export default {
  title: 'Leaflet GeoSearch',
  typescript: true,
  themeConfig: {
    showPlaygroundEditor: true,
  },
  src: 'docs',
  dest: '.docz/dist',
  public: 'assets',
  ignore: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'LICENSE.md'],
  menu: [
    { name: 'Introduction' },
    { name: 'Usage' },
    { name: 'Providers', menu: ['Bing', 'Esri', 'Google', 'LocationIQ', 'OpenCage', 'OpenStreetMap'] },
  ],
};
