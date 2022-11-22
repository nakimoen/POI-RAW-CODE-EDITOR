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
    callback(root);
  };
  reader.onloadend = () => {
    //TODO unlock window
  };
}
