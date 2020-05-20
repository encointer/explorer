import assert from 'assert';

/// Function to produce function to convert fixed-point to Number
///
/// Fixed interpretation of u<N> place values
/// ... ___ ___ ___ ___ . ___ ___ ___ ___ ...
/// ...  8   4   2   1    1/2 1/4 1/8 1/16...
///
/// Parameters:
/// upper: 0..128 - number of bits in decimal part
/// lower: 0..128 - number of bits in fractional part
///
/// Produced function parameters:
/// raw: substrate_fixed::types::I<upper>F<lower> as I<upper+lower>
/// precision: 0..lower number bits in fractional part to process
export function parserFixPoint (upper, lower) {
  const len = upper + lower;
  assert(len >= 8, `Bit length can't be less than 8, provided ${len}`);
  assert(len <= 128, `Bit length can't be bigger than 128, provided ${len}`);
  assert(!(len & (len - 1)), `Bit length should be power of 2, provided ${len}`);

  return (raw, precision = lower) => {
    assert(raw.bitLength() === len, 'Bit length is not equal to ' + len);
    const bits = raw.toString(2, len);
    const lowerBits = (lower > bits.length
      ? bits.padStart(lower, '0')
      : bits).slice(-lower, -1 * (lower - precision) || undefined);
    const floatPart = lowerBits
      .split('')
      .reduce((acc, bit, idx) => {
        acc = acc + (bit === '1' ? 1 / 2 ** (idx + 1) : 0);
        return acc;
      }, 0);
    const upperBits = bits.slice(0, -lower);
    const decimalPart = upperBits ? parseInt(upperBits, 2) : 0;
    return decimalPart + (raw.negative ? -floatPart : floatPart);
  };
}

export const parseI4F4 = parserFixPoint(4, 4);

export const parseI8F8 = parserFixPoint(8, 8);

export const parseI16F16 = parserFixPoint(16, 16);

export const parseI32F32 = parserFixPoint(32, 32);

export const parseI64F64 = parserFixPoint(64, 64);

/// map and reduce helper
function mapReduce (arr, mapperFn, reducerFn) {
  let result = arr;
  if (mapperFn) {
    result = result.map(mapperFn);
  }
  if (reducerFn) {
    result = result.reduce(reducerFn, {});
  }
  return result;
}

/// Function that calls provided api method parameters provided in ids array
/// Will return value when all promises finishes optionally converted with mapperFn
export async function batchFetch (apiMethod, ids, mapperFn, reducerFn) {
  const responses = await Promise.all(ids.map(it => apiMethod(it))); // array of fetching promises
  return mapReduce(responses, mapperFn, reducerFn); // Called when all promises fullfils
}
