export default {
  title: 'Leaflet GeoSearch',
  typescript: true,
  themeConfig: {
    showPlaygroundEditor: true,
  },
  src: 'docs',
  dest: '.docz/dist',
  public: 'docs/assets',
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
        'LocationIQ',
        'OpenCage',
        'OpenStreetMap',
        'Custom Providers',
      ],
    },
  ],
};
