/*
 * L.Control.GeoSearch - search for an address and zoom to its location
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch = {};
L.GeoSearch.Provider = {};

L.GeoSearch.Result = function (x, y, label, bounds, details) {
    this.X = x;
    this.Y = y;
    this.Label = label;
    this.bounds = bounds;

    if (details)
        this.details = details;
};

L.Control.GeoSearch = L.Control.extend({
    options: {
        position: 'topleft',
        showMarker: true,
        showPopup: false,
        customIcon: false,
        retainZoomLevel: false,
        draggable: false
    },

    _config: {
        country: '',
        searchLabel: 'Enter address',
        notFoundMessage: 'Sorry, that address could not be found.',
        messageHideDelay: 3000,
        zoomLevel: 18,
        enableButtons: false,
        enableAutoComplete: false,
        autocompleteMinQueryLen: 3,
        autocompleteQueryDelay_ms: 800
    },

    initialize: function (options) {
        L.Util.extend(this.options, options);
        L.Util.extend(this._config, options);
    },

    resetLink: function(extraClass) {
        var link = this._container.querySelector('a');
        link.className = 'leaflet-bar-part leaflet-bar-part-single' + ' ' + extraClass;
    },

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-geosearch');

        // create the link - this will contain one of the icons
        var link = L.DomUtil.create('a', '', this._container);
        link.href = '#';
        link.title = this._config.searchLabel;

        // set the link's icon to magnifying glass
        this.resetLink('glass');

        // create the form that will contain the input
        var form = L.DomUtil.create('form', 'displayNone', this._container);

        // create the input, and set its placeholder text
        var searchbox = L.DomUtil.create('input', null, form);
        searchbox.type = 'text';
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;
        if (this._autocomplete) {
            this._autocomplete.recordLastUserInput('');
        }

        if (this._config.enableButtons) {
            var submitContainer = L.DomUtil.create('span', 'leaflet-geosearch-submit-button-container', form);
            L.DomUtil.create('span', 'leaflet-geosearch-submit-button', submitContainer);
            var cancelButton = L.DomUtil.create('span', 'leaflet-geosearch-cancel-button', form);
            L.DomEvent.on(submitContainer, 'click', this.startSearch, this);
            L.DomEvent.on(cancelButton, 'click', this._clearUserSearchInput, this);
        }

        var msgbox = L.DomUtil.create('div', 'leaflet-bar message displayNone', this._container);
        this._msgbox = msgbox;

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', function() {

                if (L.DomUtil.hasClass(form, 'displayNone')) {
                    L.DomUtil.removeClass(form, 'displayNone'); // unhide form
                    searchbox.focus();
                } else {
                    L.DomUtil.addClass(form, 'displayNone'); // hide form
                }

            })
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        if (this._config.enableAutoComplete) {
            this._autocomplete = new L.AutoComplete({}).addTo(this._container, function (suggestionText, isActivated) {
                this._searchbox.value = suggestionText;
                if (isActivated) {
                    this.startSearch();
                }
            }.bind(this));
        }

        // TODO This will result in duplicate processing of events. Options?
        L.DomEvent
            .addListener(this._searchbox, 'keypress', this._onKeyPress, this)
            .addListener(this._searchbox, 'keyup', this._onKeyUp, this)
            .addListener(this._searchbox, 'input', this._onInput, this)
            .addListener(this._searchbox, 'change', this._onInputUpdate, this)
            .addListener(this._searchbox, 'paste', this._onPasteToInput, this);

        L.DomEvent.disableClickPropagation(this._container);

        return this._container;
    },

    geosearch: function (qry) {
        this.geosearch_ext(qry, this._processResults.bind(this), this._printError.bind(this));
    },

    geosearch_ext: function(qry, onSuccess, onFailure) {
        try {
            var provider = this._config.provider;

            if(typeof provider.GetLocations == 'function') {
                provider.GetLocations(qry, function(results) {
                    onSuccess(results, qry);
                });
            }
            else {
                var url = provider.GetServiceUrl(qry);
                this.sendRequest(provider, url, qry, onSuccess, onFailure);
            }
        }
        catch (error) {
            onFailure(error);
        }
    },

    // qry may be a String or a function
    geosearch_autocomplete: function (qry, requestDelay_ms) {
        if (!this._config.enableAutoComplete) {
            return;
        }

        clearTimeout(this._autocompleteRequestTimer);

        this._autocompleteRequestTimer = setTimeout(function () {
            var q = qry;
            if (typeof qry === 'function') {
                q = qry();
            }
            if (q.length >= this._config.autocompleteMinQueryLen) {
                this.geosearch_ext(q, this._autocomplete.show.bind(this._autocomplete), this._autocomplete.hide.bind(this._autocomplete));
            } else {
                this._autocomplete.hide();
            }
        }.bind(this), requestDelay_ms);
    },

    cancelSearch: function() {
        var form = this._container.querySelector('form');
        L.DomUtil.addClass(form, 'displayNone');

        this._clearUserSearchInput();
        this.resetLink('glass');

        L.DomUtil.addClass(this._msgbox, 'displayNone');

        this._map._container.focus();
    },

    startSearch: function() {
        var q = this._searchbox.value;
        if (q.length > 0) {
            this._hideAutocomplete();
            // show spinner icon
            this.resetLink('spinner');
            this.geosearch(q);
        }
    },

    sendRequest: function (provider, url, qry, onSuccess, onFailure) {
        window.parseLocation = function (response) {
            var results = provider.ParseJSON(response);
            onSuccess(results, qry);

            document.body.removeChild(document.getElementById('getJsonP'));
            delete window.parseLocation;
        };

        function getJsonP (url) {
            url = url + '&callback=parseLocation';
            var script = document.createElement('script');
            script.id = 'getJsonP';
            script.src = url;
            script.async = true;
            document.body.appendChild(script);
        }

        if (XMLHttpRequest) {
            var xhr = new XMLHttpRequest();

            if ('withCredentials' in xhr) {
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            var response = JSON.parse(xhr.responseText),
                                results = provider.ParseJSON(response);

                            onSuccess(results, qry);
                        } else if (xhr.status == 0 || xhr.status == 400) {
                            getJsonP(url);
                        } else {
                            onFailure(xhr.responseText);
                        }
                    }
                };

                xhr.open('GET', url, true);
                xhr.send();
            } else if (XDomainRequest) {
                var xdr = new XDomainRequest();

                xdr.onerror = function (err) {
                    onFailure(err);
                };

                xdr.onload = function () {
                    var response = JSON.parse(xdr.responseText),
                        results = provider.ParseJSON(response);

                    onSuccess(results, qry);
                };

                xdr.open('GET', url);
                xdr.send();
            } else {
                getJsonP(url);
            }
        }
    },

    _processResults: function(results, qry) {
        if (results.length > 0) {
            this._map.fireEvent('geosearch_foundlocations', {Locations: results});
            this._showLocation(results[0], qry);
            this.cancelSearch();
        } else {
            this._printError(this._config.notFoundMessage);
        }
    },

    _showLocation: function (location, qry) {
        if (this.options.showMarker == true) {
            if (typeof this._positionMarker === 'undefined') {
                this._positionMarker = L.marker(
                    [location.Y, location.X],
                    {draggable: this.options.draggable}
                ).addTo(this._map);
                if( this.options.customIcon ) {
                    this._positionMarker.setIcon(this.options.customIcon);
                }
                if( this.options.showPopup ) {
                   this._positionMarker.bindPopup(qry).openPopup();
                }
            }
            else {
                this._positionMarker.setLatLng([location.Y, location.X]);
                if( this.options.showPopup ) {
                   this._positionMarker.bindPopup(qry).openPopup();
                }
            }
        }
        if (!this.options.retainZoomLevel && location.bounds && location.bounds.isValid()) {
            this._map.fitBounds(location.bounds);
        }
        else {
            this._map.setView([location.Y, location.X], this._getZoomLevel(), false);
        }

        this._map.fireEvent('geosearch_showlocation', {
          Location: location,
          Marker : this._positionMarker
        });
    },

    _isShowingError: false,

    _printError: function(message) {
        this._msgbox.innerHTML = message;
        L.DomUtil.removeClass(this._msgbox, 'displayNone');

        this._map.fireEvent('geosearch_error', {message: message});

        // show alert icon
        this.resetLink('alert');
        this._isShowingError = true;
    },

    _getZoomLevel: function() {
        if (! this.options.retainZoomLevel) {
            return this._config.zoomLevel;
        }
        return this._map._zoom;
    },

    _onInput: function() {
        if (this._isShowingError) {
            this.resetLink('glass');
            L.DomUtil.addClass(this._msgbox, 'displayNone');

            this._isShowingError = false;
        }
    },

    _onKeyPress: function (e) {
        var enterKey = 13;

        if (e.keyCode === enterKey) {
            e.preventDefault();
            e.stopPropagation();

            this.startSearch();
        }
    },

    _hideAutocomplete: function () {
        clearTimeout(this._autocompleteRequestTimer);
        if (this._config.enableAutoComplete && this._autocomplete.isVisible()) {
            this._autocomplete.hide();
            return true;
        }
        return false;
    },

    _setCancelButtonVisible(isVisible) {
        var el = document.getElementsByClassName('leaflet-geosearch-cancel-button');
        var val = isVisible ? 'block' : 'none';
        var ii;
        for (ii = 0; ii < el.length; ++ii) {
            el[ii].style.display = val;
        }
    },

    _clearUserSearchInput: function () {
        this._hideAutocomplete();
        this._searchbox.value = '';
        this._setCancelButtonVisible(false);
    },

    _onPasteToInput: function () {
        // onpaste requires callback to allow for input update do this by default.
        setTimeout(this._onInputUpdate.bind(this), 0);
    },

    _onInputUpdate: function () {
        // define function for requery of user input after delay
        var sb = this._searchbox;
        function getQuery() {
            return sb.value;
        }
        var qry = getQuery();

        if (this._config.enableAutoComplete) {
            this._autocomplete.recordLastUserInput(qry);
            if (qry.length >= this._config.autocompleteMinQueryLen) {
                this.geosearch_autocomplete(getQuery, this._config.autocompleteQueryDelay_ms);
            } else {
                this._autocomplete.hide();
            }
        }

        this._setCancelButtonVisible(qry.length > 0);
    },

    _onKeyUp: function (e) {
        var enterKey = 13;
        var shift = 16;
        var ctrl = 17;
        var escapeKey = 27;
        var leftArrow = 37;
        var upArrow = 38;
        var rightArrow = 39;
        var downArrow = 40;

        switch (e.keyCode) {
            case escapeKey:
                // ESC first closes autocomplete if open. If closed then clears input or stops search.
                if (!this._hideAutocomplete()) {
                    this.cancelSearch();
                }
                break;
            case upArrow:
                if (this._config.enableAutoComplete && this._autocomplete.isVisible()) {
                    this._autocomplete.moveUp();
                }
                break;
            case downArrow:
                if (this._config.enableAutoComplete && this._autocomplete.isVisible()) {
                    this._autocomplete.moveDown();
                }
                break;
            case enterKey:
            case leftArrow:
            case rightArrow:
            case shift:
            case ctrl:
                break;
            default:
                this._onInputUpdate();
         }
     }
 });

L.AutoComplete = L.Class.extend({
    _config: {
        'maxResultCount': 10,
        'onMakeSuggestionHTML': null
    },

    initialize: function (options) {
        L.Util.extend(this._config, options);
    },

    addTo: function (container, onSelectionCallback) {
        this._container = container;
        this._onSelection = onSelectionCallback;
        return this._createUI(container, 'leaflet-geosearch-autocomplete');
    },

    onMakeSuggestionHTML: function (geosearchResult) {
        if (this._config.onMakeSuggestionHTML) {
            return this._config.onMakeSuggestionHTML(geosearchResult);
        } else {
            return this._htmlEscape(geosearchResult.Label);
        }
    },

    recordLastUserInput: function (str) {
        this._lastUserInput = str;
    },

    _createUI: function (container, className) {
        this._tool = L.DomUtil.create('div', className, container);
        this._tool.style.display = 'none';
        L.DomEvent
            .disableClickPropagation(this._tool)
            // consider whether to make delayed hide onBlur.
            // If so, consider canceling timer on mousewheel and mouseover.
            .on(this._tool, 'blur', this.hide, this)
            .on(this._tool, 'mousewheel', function(e) {
                L.DomEvent.stopPropagation(e); // to prevent map zoom
                if (e.axis === e.VERTICAL_AXIS) {
                    if (e.detail > 0) {
                        this.moveDown();
                    } else {
                        this.moveUp();
                    }
                }
            }, this);
        return this;
    },

    show: function (results) {
        this._tool.innerHTML = '';
        this._tool.currentSelection = -1;
        var count = 0;
        while (count < results.length && count < this._config.maxResultCount) {
            var entry = this._newSuggestion(results[count]);
            this._tool.appendChild(entry);
            ++count;
        }
        if (count > 0) {
            this._tool.style.display = 'block';
        } else {
            this.hide();
        }
        return count;
    },

    hide: function () {
        this._tool.style.display = 'none';
        this._tool.innerHTML = '';
    },

    isVisible: function() {
        return this._tool.style.display !== 'none';
    },

    _htmlEscape: function (str) {
        // implementation courtesy of http://stackoverflow.com/a/7124052
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    _newSuggestion: function (result) {
        var tip = L.DomUtil.create('li', 'leaflet-geosearch-suggestion');
        tip.innerHTML = this.onMakeSuggestionHTML(result);
        tip._text = result.Label;
        L.DomEvent
            .disableClickPropagation(tip)
            .on(tip, 'click', function(e) {
                this._onSelection(tip._text, true);
            }.bind(this), this);
        return tip;
    },

    _onSelectedUpdate: function () {
        var entries = this._tool.hasChildNodes() ? this._tool.childNodes : [];
        for (var ii=0; ii < entries.length; ++ii) {
            L.DomUtil.removeClass(entries[ii], 'leaflet-geosearch-suggestion-selected');
        }

        // if selection is -1, then show last user typed text
        if (this._tool.currentSelection >= 0) {
            L.DomUtil.addClass(entries[this._tool.currentSelection], 'leaflet-geosearch-suggestion-selected');

            // scroll:
            var tipOffsetTop = entries[this._tool.currentSelection].offsetTop;
            if (tipOffsetTop + entries[this._tool.currentSelection].clientHeight >= this._tool.scrollTop + this._tool.clientHeight) {
                this._tool.scrollTop = tipOffsetTop - this._tool.clientHeight + entries[this._tool.currentSelection].clientHeight;
            }
            else if (tipOffsetTop <= this._tool.scrollTop) {
                this._tool.scrollTop = tipOffsetTop;
            }

            this._onSelection(entries[this._tool.currentSelection]._text, false);
        } else {
            this._onSelection(this._lastUserInput, false);
        }
    },
    moveUp: function () {
        // permit selection to decrement down to -1 (none selected)
        if (this.isVisible() && this._tool.currentSelection >= 0) {
            --this._tool.currentSelection;
            this._onSelectedUpdate();
        }
        return this;
    },
    moveDown: function () {
        if (this.isVisible()) {
            this._tool.currentSelection = (this._tool.currentSelection + 1) % this.suggestionCount();
            this._onSelectedUpdate();
        }
        return this;
    },

    suggestionCount: function () {
        return this._tool.hasChildNodes() ? this._tool.childNodes.length : 0;
    }
});
