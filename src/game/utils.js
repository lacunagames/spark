const utils = {
  round: (val, decimal = 2) => {
    const multi = Math.pow(10, decimal);
    return Math.round((val + Number.EPSILON) * multi) / multi;
  },

  randomEl: array => {
    return array?.[Math.floor(Math.random() * array?.length)];
  },

  // Turn string with number range values to random number eg. 7-11 -> 10
  getNumber: str => {
    if (typeof str !== 'string') {
      return str;
    }
    const [min, max] = str.replace(/\s/g, '').split('-');
    return Math.floor(Math.random() * (+max - +min + 1)) + +min;
  },
};

export default utils;
