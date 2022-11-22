function _codeDresser(codeStr) {
  return codeStr
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/(&lt;\/?(.+?)gt;)/g, function (p1) {
      //TODO: coloring, $1 condition
      return '<span class="code-tag-color">' + p1 + '</span>';
    });
}
document.querySelector('#point-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const containers = document.querySelectorAll('.point-box');
  const root = new DOMParser().parseFromString('<Points></Points>', 'text/xml');
  const rootDom = root.querySelector('Points');
  containers.forEach((container) => {
    const point = {
      desc: container.querySelector('.desc').value,
      type: container.querySelector('.type').value,
      lat: container.querySelector('.lat').value,
      lng: container.querySelector('.lng').value,
    };
    const pointNode = toCnxPointNode(point);
    rootDom.appendChild(pointNode);
  });

  var serializer = new XMLSerializer();
  var xmlString = serializer.serializeToString(root);

  const html = _codeDresser(
    '<PointsCount>' + '\n</PointsCount>\n' + vkbeautify.xml(xmlString)
  );

  document.querySelector('.overlay > .window > pre > code').innerHTML = html;
  document.querySelector('#pop-up').click();
});

function delPoint(self) {
  self.closest('.point-box').remove();
}

function _generateDomForPoint(_document, tagStr, val) {
  const dom = _document.createElement(tagStr);
  dom.innerHTML = val;
  return dom;
}
function toCnxPointNode(pointJSON) {
  const root = new DOMParser().parseFromString('<Point></Point>', 'text/xml');
  const pointDom = root.querySelector('Point');

  pointDom.appendChild(_generateDomForPoint(root, 'Lat', pointJSON.lat));
  pointDom.appendChild(_generateDomForPoint(root, 'Lng', pointJSON.lng));
  pointDom.appendChild(_generateDomForPoint(root, 'Type', pointJSON.type));
  pointDom.appendChild(_generateDomForPoint(root, 'Descr', pointJSON.desc));

  return pointDom;
}

function addPoint() {
  const template = document.querySelector('#point-template');
  document
    .querySelector('#point-container')
    .appendChild(document.importNode(template.content, true));
}

//TODO:FIX: trimPosition
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
