function toBeValidCoordinate(coord) {
  // coordinate must have two dimensions
  if (!Array.isArray(coord) || coord.length !== 2) {
    return {
      pass: false,
      message: `coordinate must have two dimensions`,
    };
  }

  // coordinate dimensions must be valid numbers
  if (
    typeof coord[0] !== 'number' ||
    isNaN(coord[0]) ||
    typeof coord[1] !== 'number' ||
    isNaN(coord[1])
  ) {
    return {
      pass: false,
      message: `coordinate dimensions must be valid numbers`,
    };
  }

  // coordinate valid
  return {
    pass: true,
    message: `coordinate valid`,
  };
}

function toBeValidBounds(bounds) {
  // null bounds are valid
  if (bounds === null) {
    return {
      pass: true,
      message: `null bounds are valid`,
    };
  }

  // bounds must be a coordinate pair
  if (!Array.isArray(bounds) || bounds.length !== 2) {
    return {
      pass: false,
      message: `bounds must be a coordinate pair`,
    };
  }

  // validate south-west
  const validateSW = toBeValidCoordinate(bounds[0]);
  if (!validateSW.pass) {
    return validateSW;
  }

  // validate north-east
  const validateNE = toBeValidCoordinate(bounds[1]);
  if (!validateNE.pass) {
    return validateNE;
  }

  // corners
  const [south, west] = bounds[0];
  const [north, east] = bounds[1];

  // bounds represents a point
  // note: this is not really a valid bounds but we will allow it
  if (south === north && west === east) {
    return {
      pass: true,
      message: `bounds represents a point`,
    };
  }

  // west should be less than or equal to east
  // @note: this is not the strictly case for bounds which cross the antimeridian
  if (west > east) {
    return {
      pass: false,
      message: `west should be less than or equal to east`,
    };
  }

  // south should be less than or equal to north
  // @note: this is not the strictly case for bounds which cross a pole
  if (south > north) {
    return {
      pass: false,
      message: `south should be less than or equal to north`,
    };
  }

  // bounds valid
  return {
    pass: true,
    message: `bounds valid`,
  };
}

expect.extend({
  toBeValidCoordinate,
  toBeValidBounds,
});
