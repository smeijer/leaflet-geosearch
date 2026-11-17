// The Leaflet version of a page comes from ?leaflet=. `leaflet` and
// `leaflet-2` are the dev dependencies (Leaflet 1 and 2) in node_modules,
// anything else a version in e2e/vendor/leaflet (scripts/e2e-leaflet.mjs), like
// 1.6.0 or main. Leaflet 1 has a UMD and an ESM build, Leaflet 2 an ESM and a
// global build, and Leaflet's main branch only its ESM source. Plain ES5, for
// the oldest browsers in CI.
(function () {
  var match = /[?&]leaflet=([\w.-]+)/.exec(location.search);
  var version = match ? match[1] : 'leaflet';
  var installed = version === 'leaflet' || version === 'leaflet-2';
  var base = installed
    ? '/node_modules/' + version + '/'
    : '/e2e/vendor/leaflet/' + version + '/';
  var files;
  if (version === 'main') {
    files = { css: 'src/leaflet.css', esm: 'src/Leaflet.js', global: null };
  } else if (version === 'leaflet' || version.charAt(0) === '1') {
    files = {
      css: 'dist/leaflet.css',
      esm: 'dist/leaflet-src.esm.js',
      global: 'dist/leaflet.js',
    };
  } else {
    files = {
      css: 'dist/leaflet.css',
      esm: 'dist/leaflet.js',
      global: 'dist/leaflet-global.js',
    };
  }

  // not window.leaflet, the UMD build of Leaflet 1.9 sets that
  window.e2eLeaflet = {
    version: version,
    css: base + files.css,
    esm: base + files.esm,
    global: files.global && base + files.global,
  };
  document.write(
    '<link rel="stylesheet" href="' + window.e2eLeaflet.css + '" />',
  );
})();
