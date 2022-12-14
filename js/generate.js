const GROBAL = { imported: undefined };
/**
 *
 * @param {Document} root
 */
function _parseCNX(root) {
  function setVal(dom, cl, tag) {
    document.querySelector('.point-box:last-child input.' + cl).value =
      dom.querySelector(tag).innerHTML;
  }

  try {
    const routeDom = root.querySelector('Route');
    const points = routeDom.querySelectorAll('Point');

    GROBAL.imported = root;

    document.getElementById('point-container').innerHTML = '';
    points.forEach((point) => {
      addPoint();
      setVal(point, 'lat', 'Lat');
      setVal(point, 'lng', 'Lng');
      setVal(point, 'desc', 'Descr');
      // TODO: in order to get dom, want to use returns of addPoint()
      document.querySelector('.point-box:last-child select.type').value =
        point.querySelector('Type').innerHTML;
    });
  } catch (error) {
    GROBAL.imported = null;
    alert('ファイルインポートに失敗しました。');
  }
}

document.querySelector('#import-button').addEventListener('click', function () {
  startLocalXMLImport('import-file-input', _parseCNX);
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
    routeDom.removeChild(routeDom.querySelector('PointsCount'));
    routeDom.removeChild(routeDom.querySelector('Points'));
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
  self.closest('.point-box').remove();
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

/**
 *
 * @returns {any}
 */
function addPoint() {
  const templateContent = document.importNode(
    document.querySelector('#point-template').content,
    true
  );
  const container = document.querySelector('#point-container');
  container.appendChild(templateContent);
  return templateContent;
}

//TODO:FIX: trimPosition
/**
 *
 * @param {string} position
 * @returns {string}
 */
function trimPosition(position) {
  try {
    const splited = position.split('.');
    if (splited.length != 2) {
      return null;
    }
    return [splited[0].trim(), splited[1].trim().substr(0, 7)].join('.');
  } catch (err) {
    position.value = null;
  }
}

/**
 *
 * @param {HTMLElement} self
 */
function validatePosition(self) {
  try {
    const position = self.value.split(',');
    if (position.length != 2) {
      return alert('[0]不正な値です');
    }

    const lat = trimPosition(position[0]);
    const lng = trimPosition(position[1]);
    if (!lat || !lng) {
      return alert('[1]不正な値です');
    }

    const container = self.closest('.point-box');
    self.value = null;
    container.querySelector('.lat').value = lat;
    container.querySelector('.lng').value = lng;
  } catch (error) {
    alert('[3]不正な値です。');
  }
}
