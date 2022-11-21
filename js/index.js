document
  .querySelector('#point-content')
  .addEventListener('submit', function (e) {
    e.preventDefault();

    const containers = document.querySelectorAll('.point-container');
    const root = new DOMParser().parseFromString(
      '<Points></Points>',
      'text/xml'
    );
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

    document.querySelector('#output-wrapper > pre').innerText =
      '<PointsCount>' + '\n</PointsCount>\n' + vkbeautify.xml(xmlString);
  });

function delPoint(self) {
  self.closest('.point-container').remove();
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
    .querySelector('#point-content')
    .appendChild(document.importNode(template.content, true));
}

function trimPosition(position) {
  try {
    const splited = position.split('.');
    if (splited.length != 2) {
      return null;
    }
    return [splited[0].trim(), splited[1].trim().substr(0, 7)].join('.');
  } catch (err) {
    alert('[2]不正な値です。');
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

    const container = self.closest('.point-container');
    self.value = null;
    container.querySelector('.lat').value = lat;
    container.querySelector('.lng').value = lng;
  } catch (error) {
    alert('[3]不正な値です。');
  }
}
