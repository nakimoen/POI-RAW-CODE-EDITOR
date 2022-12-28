/**
 * @typedef {'addMarker' | 'dragendMarker'} EventName
 */
class MarkerOption {
  constructor(title) {
    this.title = title;
  }
}
class Marker {
  /**
   *
   * @param {*} marker LeafletMarker
   * @param {Number|string} leafletId
   * @param {MarkerOption} option
   */
  constructor(marker, option) {
    this.marker = marker;
    this.markerId = marker._leaflet_id;
    this.option = option;
  }

  remove() {
    this.marker.remove();
  }
}

class MapController {
  /**
   * @type {Array<Marker>}
   */
  #Markers;
  #Map;
  #Events;
  Distance;
  Ascent;
  Descent;
  /**
   *
   * @param {string} elementId
   * @param {any} opt leaflet option
   */
  constructor(elementId, opt) {
    // if (!window.L) {
    //   this = null;
    // }
    this.#Markers = new Array();
    this.#Map = this.#initMap(elementId, opt);
    this.#Events = {};
  }

  /**
   *
   * @param {EventName} eventName
   * @param {Function} fn
   */
  on(eventName, fn) {
    this.#Events[eventName] = fn;
  }

  getMap() {
    return this.#Map;
  }

  getMarkers() {
    return this.#Markers;
  }

  drawGPX(gpx) {
    const instance = this;
    new L.GPX(gpx, {
      async: true,
      marker_options: {
        startIconUrl: '../img/pin-icon-start.png',
        endIconUrl: '../img/pin-icon-end.png',
        shadowUrl: false,
      },
    })
      .on('loaded', function (e) {
        const gpx = e.target;
        instance.#Map.fitBounds(gpx.getBounds());
        instance.Distance = gpx.get_distance();
        instance.Ascent = Math.floor(gpx.get_elevation_gain()) || '';
        instance.Descent = -Math.floor(gpx.get_elevation_loss()) || '';
      })
      .addTo(instance.#Map);
  }
  removeMarker(markerId) {
    const marker = this.#Markers.filter((marker, index) => {
      return marker.markerId == markerId;
    })[0];
    let ind;
    if (~(ind = this.#Markers.indexOf(marker))) {
      this.#Markers.splice(ind, 1);
      this.#Map.removeLayer(marker.marker);
    }
  }

  /**
   *
   * @param {string} lat
   * @param {string} lng
   * @param {MarkerOption}
   * @returns {Marker}
   */
  addMarker(lat, lng, opt) {
    const instance = this;

    const marker = L.marker({ lat: lat, lng: lng }, { draggable: true })
      // .on('click', onMarkerClick)
      .addTo(this.#Map)
      .bindPopup(`${opt ? opt.title : ''}`)
      .openPopup();

    this.#Events['addMarker']({
      leaflet_id: marker._leaflet_id,
      latlng: marker.getLatLng(),
    });

    marker.on('dragend', function (e) {
      const leafletId = e.target._leaflet_id;
      const latlng = e.target._latlng;
      instance.#Events['dragendMarker']({
        leaflet_id: leafletId,
        latlng: latlng,
      });
    });
    const ret = new Marker(marker, opt);
    this.#Markers.push(ret);
    return ret;
  }
  /**
   *
   * @param {Number} markerId
   * @param {String|HTMLElement|Function|Popup} content
   */
  setMarkerPopupContent(markerId, content) {
    const marker = this.#Markers.filter((x) => {
      return x.markerId == markerId;
    })[0];
    //TODO marker validation
    if (marker && marker.marker) {
      // TODO do not work???       marker.marker.setPopupContent(content);

      marker.marker.unbindPopup();
      marker.marker.bindPopup(content);
      this.#Map.flyTo(marker.marker.getLatLng(), 18);
      marker.marker.openPopup();
    }
  }

  panToMarker(markerId) {
    const marker = this.#Markers.filter((x) => x.markerId == markerId)[0];
    if (marker && marker.marker) {
      // this.#Map.panTo(marker.marker.getLatLng());
      marker.marker.openPopup();
      this.#Map.fitBounds(L.latLngBounds([marker.marker.getLatLng()]));
    }
  }
  /**
   *
   * @param {string} elementId
   * @param {any} opt leaflet option
   * @returns
   */
  #initMap(elementId, opt) {
    if (!window.L) {
      window.alert('[0]地図の読み込みができませんでした。');
      return null;
    }

    const instance = this;

    const map = L.map(elementId, opt);

    // const tileLayer = L.tileLayer(
    //   '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    //   {
    //     attribution:
    //       '<a href="//osm.org/copyright">OpenStreetMap</a> contributors, <a href="//creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    //   }
    // );
    const tileLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
      {
        attribution:
          " <a href='https://github.com/mpetazzoni/leaflet-gpx' target='_blank'>leaflet-gpx</a> | <a href='https://developers.google.com/maps/documentation' target='_blank'>Google Map</a>",
      }
    );
    tileLayer.addTo(map);

    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const marker = instance.addMarker(lat, lng);
    });

    return map;
  }
}

window.mapController = new MapController('map', {
  center: [35.68148019312498, 139.7671569845131],
  zoom: 17,
});
