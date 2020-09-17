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

  findInArray(array, id, labelsAllowed) {
    const isIdArray = Array.isArray(id);
    return array.find(
      item =>
        (isIdArray
          ? id.includes(item.id ?? item.index)
          : item.id === id ||
            ({}.hasOwnProperty.call(item, 'index') && item.index === id)) ||
        (labelsAllowed &&
          (isIdArray
            ? id.find(idFind => item.labels?.includes(idFind))
            : item.labels?.includes(id)))
    );
  },
};

export default utils;
