const utils = {
  round: (val, decimal = 2) => {
    const multi = Math.pow(10, decimal);
    return Math.round((val + Number.EPSILON) * multi) / multi;
  },
  randomEl: array => {
    return array?.[Math.floor(Math.random() * array?.length)];
  },
};

export default utils;
