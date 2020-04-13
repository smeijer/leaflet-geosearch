require('dotenv').config({
  path: '.env',
});

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-react-leaflet',
      options: {
        linkStyles: true,
      },
    },
  ],
};
