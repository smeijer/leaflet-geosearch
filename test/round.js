const round = (num) => {
  if (Array.isArray(num)) {
    return num.map(round);
  }

  return Math.round(num * 10) / 10;
};

export default round;
