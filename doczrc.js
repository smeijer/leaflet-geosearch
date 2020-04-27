export default {
  title: 'Leaflet GeoSearch',
  typescript: true,
  themeConfig: {
    showPlaygroundEditor: true,
  },
  src: 'docs',
  dest: '.docz/dist',
  public: 'docs/assets',
  host: '0.0.0.0',
  editBranch: 'develop',
  ignore: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'LICENSE.md'],
  menu: [
    { name: 'Introduction' },
    { name: 'Usage' },
    { name: 'Leaflet Control' },
    {
      name: 'Providers',
      menu: [
        'Bing',
        'Esri',
        'Google',
        'Here',
        'LocationIQ',
        'OpenCage',
        'OpenStreetMap',
        'Custom Providers',
      ],
    },
  ],
};
