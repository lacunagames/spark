const utils = {
  round: (val, decimal = 2) => {
    const multi = Math.pow(10, decimal);
    return Math.round((val + Number.EPSILON) * multi) / multi;
  },
};

export default utils;
