const GROBAL = { imported: undefined };

window.mapController.on('addMarker', (e) => {
  addPoint(e.leaflet_id, e.latlng);
});
window.mapController.on('dragendMarker', (e) => {
  const id = e.leaflet_id;
  const pointBox = document.querySelector(
    '.point-box[data-marker-id ="' + id + '"]'
  );
  pointBox.querySelector('.lat').value = e.latlng.lat;
  pointBox.querySelector('.lng').value = e.latlng.lng;
});

const _parseTCX = window.tcx2cnx;
/**
 * CNX documentから
 * @param {Document} root
 */
function _setupRoot(root) {
  function getPointValue(pointDom, tag) {
    return pointDom.querySelector(tag).innerHTML;
  }
  function setValueIntoDom(cl, value) {
    document.querySelector('.point-box:last-child input.' + cl).value = value;
  }

  try {
    // TODO reset map
    const routeDom = root.querySelector('Route');
    const points = routeDom.querySelectorAll('Point');

    GROBAL.imported = root;

    document.getElementById('point-container').innerHTML = '';
    let lastMarker;
    points.forEach((point) => {
      const lat = getPointValue(point, 'Lat');
      const lng = getPointValue(point, 'Lng');
      const desc = getPointValue(point, 'Descr');
      lastMarker = window.mapController.addMarker(lat, lng, {
        title: desc,
      }).marker;

      // addPoint(marker.markerId);
      setValueIntoDom('lat', lat);
      setValueIntoDom('lng', lng);
      setValueIntoDom('desc', getPointValue(point, 'Descr'));
      // TODO: in order to get dom, want to use returns of addPoint()
      document.querySelector('.point-box:last-child select.type').value =
        point.querySelector('Type').innerHTML;
    });
    if (lastMarker) {
      window.mapController.getMap().flyTo(lastMarker.getLatLng(), 10);
    }
  } catch (error) {
    console.log(error);
    GROBAL.imported = null;
    alert('ファイルインポートに失敗しました。');
  }
}

document
  .querySelector('#import-button')
  .addEventListener('click', async function () {
    const filePath = document.querySelector('#import-file-input').value;
    const format = filePath.substr(-4);

    document.getElementById('point-container').innerHTML = '';

    const serializer = new XMLSerializer();

    if (format.toLowerCase() == '.cnx') {
      startLocalXMLImport('import-file-input', (e) => {
        _setupRoot(e.document);

        const gpx = cnx2gpx(e.raw);
        window.mapController.drawGPX(serializer.serializeToString(gpx));
      });
    } else if (format.toLowerCase() == '.tcx') {
      const tcx = await tcx2cnx('import-file-input');
      _setupRoot(tcx.root);
      window.mapController.drawGPX(serializer.serializeToString(tcx.gpx));
    } else if (format.toLowerCase() == '.gpx') {
      const gpx = await gpx2cnx('import-file-input');
      _setupRoot(gpx.root);
      window.mapController.drawGPX(gpx.gpx);
    }
  });
function _codeDresser(codeStr) {
  return codeStr
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/(&lt;\/?(.+?)gt;)/g, function (p1) {
      //TODO: coloring, $1 condition
      return '<span class="code-tag-color">' + p1 + '</span>';
    });
}

document.getElementById('editor-form').addEventListener('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();
  showOutputPoints();
});

function showOutputPoints() {
  const containers = document.querySelectorAll('.point-box');
  const pointsRootDoc = new DOMParser().parseFromString(
    '<Points></Points>',
    'text/xml'
  );
  const pointsRootDom = pointsRootDoc.querySelector('Points');

  containers.forEach((container) => {
    const point = {
      desc: container.querySelector('.desc').value,
      type: container.querySelector('.type').value,
      lat: container.querySelector('.lat').value,
      lng: container.querySelector('.lng').value,
    };
    const pointNode = toCNXPointNode(point);
    pointsRootDom.appendChild(pointNode);
  });

  const serializer = new XMLSerializer();
  let html = '';
  let rootDocument;
  if (GROBAL.imported) {
    rootDocument = GROBAL.imported;
    // TODO: grobal.imported
    const routeDom = rootDocument.querySelector('Route');
    if (routeDom.querySelector('PointsCount')) {
      routeDom.removeChild(routeDom.querySelector('PointsCount'));
    }
    if (routeDom.querySelector('Points')) {
      routeDom.removeChild(routeDom.querySelector('Points'));
    }
    const pcount = rootDocument.createElement('PointsCount');
    routeDom.appendChild(pcount);
    routeDom.appendChild(pointsRootDom);

    const xmlString = serializer.serializeToString(rootDocument);
    html = _codeDresser(vkbeautify.xml(xmlString));
  } else {
    const xmlString = serializer.serializeToString(pointsRootDoc);

    html = _codeDresser(
      '<PointsCount>' + '\n</PointsCount>\n' + vkbeautify.xml(xmlString)
    );
  }

  document.querySelector('.overlay > .window > pre > code').innerHTML = html;
  document.querySelector('#pop-up').click();
  return false;
}

/**
 *
 * @param {HTMLElement} self
 */
function delPoint(self) {
  const box = self.closest('.point-box');
  window.mapController.removeMarker(box.dataset['markerId']);
  box.remove();
}

/**
 *
 * @param {Document} _document
 * @param {string} tagStr
 * @param {string} val
 * @returns {HTMLElement}
 */
function _generateDomForPoint(_document, tagStr, val) {
  const dom = _document.createElement(tagStr);
  dom.innerHTML = val;
  return dom;
}

/**
 *
 * @param {JSON} pointJSON
 * @returns {ELEMENT}
 */
function toCNXPointNode(pointJSON) {
  const { root, pointDom } = toCnxNode('Point');
  pointDom.appendChild(_generateDomForPoint(root, 'Lat', pointJSON.lat));
  pointDom.appendChild(_generateDomForPoint(root, 'Lng', pointJSON.lng));
  pointDom.appendChild(_generateDomForPoint(root, 'Type', pointJSON.type));
  pointDom.appendChild(_generateDomForPoint(root, 'Descr', pointJSON.desc));

  return pointDom;
}

/**
 *
 * @param {string} tag
 * @returns {{root:Document, pointDom:Element|null}}
 */
function toCnxNode(tag) {
  const root = new DOMParser().parseFromString(`<${tag}></${tag}>`, 'text/xml');
  return { root, pointDom: root.querySelector(tag) };
}

function onPointBoxClick(self) {
  const id = self.dataset['markerId'];
  window.mapController.panToMarker(id);
}
/**
 *
 * @param {HTMLInputELement} self
 */
function onPointTitleChange(self) {
  const title = self.value;
  const id = self.closest('.point-box').dataset['markerId'];
  window.mapController.setMarkerPopupContent(id, title);
}

/**
 *
 * @param {string} markerId
 * @param {*} latlng
 * @returns {any|null}
 */
function addPoint(markerId, latlng) {
  const templateContent = document.importNode(
    document.querySelector('#point-template').content,
    true
  );
  const container = document.querySelector('#point-container');

  if (markerId) {
    templateContent.querySelector('.point-box').dataset['markerId'] = markerId;
  }

  if (latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    templateContent.querySelector('.lat').value = lat;
    templateContent.querySelector('.lng').value = lng;
  }
  container.appendChild(templateContent);
  return templateContent;
}
