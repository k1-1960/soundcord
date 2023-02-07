/**
 * Time formatter.
 * @param {Number} ts Time in milliseconds.
 * @returns {String} Time formatted.
 */
function tp (ts) {
  let h,
  m,
  s;

  h = Math.floor(ts/(60 * 60 * 1000));
  m = Math.floor(ts/(60 * 1000));
  s = Math.floor(ts/(1000));
  
  let obj = {
    h: h > 0 ? Math.floor(m / 60): 0,
    m: m > 1 ? Math.floor(m - h * 60): 0,
    s: m > 1 ? Math.floor(s - m * 60): s
  };

  return `${obj.h > 0 ? `${obj.h}:`: ''}${obj.m > 0 ? (obj.m < 10 ? `0${obj.m}:`: `${obj.m}:`): '00:'}${obj.s > 0 ? (obj.s < 10 ? `0${obj.s}`: `${obj.s}`): '00'}`
}

module.exports = tp;