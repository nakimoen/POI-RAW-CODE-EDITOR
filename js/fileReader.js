/**
 *
 * @param {string} id
 * @param {Function} callback
 */
function startLocalXMLImport(fileInputId, callback) {
  const fileInput = document.getElementById(fileInputId);
  const fileList = fileInput.files;
  const reader = new FileReader();
  reader.readAsText(fileList[0]);
  reader.onloadstart = () => {
    //TODO lock window
  };
  reader.onload = () => {
    const root = new DOMParser().parseFromString(reader.result, 'text/xml');
    callback({ document: root, raw: reader.result });
  };
  reader.onloadend = () => {
    //TODO unlock window
  };
}

/**
 *
 * @param {string} id
 * @param {Function} callback
 */
async function startLocalXMLImportAsync(fileInputId) {
  const fileInput = document.getElementById(fileInputId);
  const fileList = fileInput.files;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(fileList[0]);
    try {
      reader.onloadstart = () => {
        //TODO lock window
      };
      reader.onload = () => {
        const root = new DOMParser().parseFromString(reader.result, 'text/xml');

        resolve({ root, raw: reader.result });
      };
      reader.onloadend = () => {
        //TODO unlock window
      };
    } catch (error) {
      reject(error);
    }
  });
}
