/**
 * @jest-environment jsdom
 */

const gpx2cnx = require('../js/gpx2cnx.js');

test('gpx2cnx test', () => {
  expect(gpx2cnx('1')).toBe(3);
});
