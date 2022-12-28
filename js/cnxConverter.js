(function () {
  if (window && !window.startLocalXMLImport) {
    return null;
  }

  function createGpxTrackPoint(doc, lat, lon, ele) {
    const trkpt = doc.createElement('trkpt');
    trkpt.setAttribute('lat', lat);
    trkpt.setAttribute('lon', lon);
    const eletag = doc.createElement('ele');
    eletag.innerHTML = ele;
    trkpt.appendChild(eletag);

    return trkpt;
  }
  /**
   *
   * @param {Document} xmlDocument
   * @returns {Document}
   */
  function tcx2gpx(xmlDocument) {
    const gpx = new DOMParser().parseFromString('<gpx></gpx>', 'text/xml');
    const gpxDom = gpx.querySelector('gpx');
    const trkseg = gpx.createElement('trkseg');

    const course = xmlDocument.querySelector('Courses > Course');
    const track = course.querySelector('Track');
    track.querySelectorAll('Trackpoint').forEach((point) => {
      const position = point.querySelector('Position');
      const lat = position.querySelector('LatitudeDegrees').innerHTML;
      const lon = position.querySelector('LongitudeDegrees').innerHTML;
      const alti = point.querySelector('AltitudeMeters').innerHTML;
      const trkpt = createGpxTrackPoint(gpx, lat, lon, alti);
      trkseg.appendChild(trkpt);
    });

    const trk = gpx.createElement('trk');
    trk.appendChild(trkseg);
    gpxDom.appendChild(trk);

    return gpx;
  }

  /**
   *
   * @param {string} cnx
   * @returns {Document}
   */
  function cnx2gpx(cnxString) {
    const cnx = new DOMParser().parseFromString(cnxString, 'text/xml');
    const cnxTrackString = cnx.querySelector('Tracks').innerHTML;

    const gpx = new DOMParser().parseFromString('<gpx></gpx>', 'text/xml');
    const gpxDom = gpx.querySelector('gpx');
    const trkseg = gpx.createElement('trkseg');

    const trk = gpx.createElement('trk');

    const points = cnxTrackString.split(';');
    points.forEach((point) => {
      const [lat, lng, alti] = point.split(',');
      if (!lat || !lng || !alti) {
        return false;
      }
      const trkpt = createGpxTrackPoint(gpx, lat, lng, alti / 100);
      trkseg.appendChild(trkpt);
    });

    trk.appendChild(trkseg);
    gpxDom.appendChild(trk);

    return gpx;
  }

  /**
   *
   * @param {Document} xmlDocument
   * @returns
   */
  function _parseTcx(xmlDocument) {
    const invalidCoursePointType = ['Right', 'Left', 'Straight'];
    const lap = xmlDocument.querySelector('Courses > Course > Lap');
    const distance = lap.querySelector('DistanceMeters').innerHTML;

    const trksegments = xmlDocument.querySelector('Course > Track');
    let tracks = '';
    Array.from(trksegments.children).forEach((point) => {
      tracks += toTrackPoint(point);
    });

    const points = [];
    const course = xmlDocument.querySelector(
      'TrainingCenterDatabase > Courses > Course'
    );
    course.querySelectorAll('CoursePoint').forEach((coursePoint) => {
      const type = coursePoint.querySelector('PointType').innerHTML;
      if (invalidCoursePointType.includes(type)) {
        return false; //continue
      }

      const name = coursePoint.querySelector('Name').innerHTML;
      const lat = coursePoint.querySelector('LatitudeDegrees').innerHTML;
      const lon = coursePoint.querySelector('LongitudeDegrees').innerHTML;
      // TODO: type convert
      points.push({
        desc: name,
        lat: lat,
        lng: lon,
        type: 0,
      });
    });
    return {
      data: {
        Distance: distance,
        TracksCount: trksegments.children.length,
        Tracks: tracks,
        Points: points,
      },
      gpx: tcx2gpx(xmlDocument),
    };
  }

  function _parseGpx(xmlDocument) {
    const trkseg = xmlDocument.querySelector('gpx > trk > trkseg');
    let tracks = '';
    Array.from(trkseg.children).forEach((trk) => {
      const lat = trk.attributes.lat.value;
      const lng = trk.attributes.lon.value;
      const ele = trk.querySelector('ele').innerHTML;
      tracks += `${lat},${lng},${(ele * 10000) / 100};`;
    });
    return {
      data: {
        TracksCount: trkseg.children.length,
        Tracks: tracks,
      },
    };
  }
  /**
   * async
   * @param {string} inputId
   * @param {Function} parser
   * @returns
   */
  async function load(inputId, parser) {
    return startLocalXMLImportAsync(inputId).then((result) => {
      const xmlDocument = result.root;

      const parsed = parser(xmlDocument);
      const cnx = toCnx(new CnxInfo(parsed.data));

      return {
        root: cnx,
        gpx: parsed.gpx ? parsed.gpx : result.raw,
      };
    });
  }

  /**
   *
   * @param {Element} trkpt
   */
  function toTrackPoint(trkpt) {
    const lat = trkpt.querySelector('LatitudeDegrees').innerHTML;
    const lon = trkpt.querySelector('LongitudeDegrees').innerHTML;
    const ele = trkpt.querySelector('AltitudeMeters').innerHTML;
    return `${lat},${lon},${(ele * 10000) / 100};`;
  }

  class CnxInfo {
    Id = '';
    Distance = '';
    Duration = '';
    Ascent = '';
    Descent = '';
    Encode = 0;
    Lang = 0;
    TracksCount = '';
    Tracks = '';
    Points = [];

    constructor(obj) {
      // this = this
      Object.assign(this, obj);
    }
  }

  /**
   *
   * @param {CnxInfo} data
   */
  function toCnx(data) {
    const rootDoc = new DOMParser().parseFromString(
      '<Route></Route>',
      'text/xml'
    );
    function createElement(tag, value) {
      const ele = rootDoc.createElement(tag);
      ele.innerHTML = value;
      return ele;
    }
    //TODO set id
    const root = rootDoc.querySelector('Route');
    root.appendChild(createElement('Id', data.Id));
    root.appendChild(createElement('Distance', data.Distance));
    root.appendChild(createElement('Duration', data.Duration));
    root.appendChild(createElement('Ascent', Math.floor(data.Ascent)));
    root.appendChild(createElement('Descent', Math.floor(data.Descent)));
    root.appendChild(createElement('Encode', data.Encode));
    root.appendChild(createElement('Lang', data.Lang));
    root.appendChild(createElement('TracksCount', data.TracksCount));
    root.appendChild(createElement('Tracks', data.Tracks));
    root.appendChild(createElement('Nav', ''));
    root.appendChild(createElement('PointsCount', data.Points.length));
    const points = createElement('Points');
    data.Points.forEach((point) => {
      const pointDom = createElement('Point', '');
      const lng = createElement('Lat', point.lat);
      const lat = createElement('Lng', point.lng);
      const type = createElement('Type', point.type);
      const desc = createElement('Descr', point.desc);
      pointDom.appendChild(lng);
      pointDom.appendChild(lat);
      pointDom.appendChild(type);
      pointDom.appendChild(desc);

      points.appendChild(pointDom);
    });
    root.appendChild(points);

    return rootDoc;
  }
  async function tcx2cnx(inputId) {
    return load(inputId, _parseTcx);
  }

  async function gpx2cnx(inputId) {
    return load(inputId, _parseGpx);
  }

  if (window !== undefined) {
    window.tcx2cnx = tcx2cnx;
    window.gpx2cnx = gpx2cnx;
    window.cnx2gpx = cnx2gpx;
  }

  // module.exports = function (inputId) {
  //   console.log(inputId);
  //   return inputId;
  // };
})();
