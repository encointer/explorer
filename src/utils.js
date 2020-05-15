/// Function to convert fixedpoint SCALE-encoded to Number
/// raw: substrate_fixed::types::I32F32 as I64
export function parseFixPoint (raw) {
  // Fixed interpretation of u32 place values
  // ... ___ ___ ___ ___ . ___ ___ ___ ___ ...
  // ...  8   4   2   1    1/2 1/4 1/8 1/16...
  const bits = raw.toString(2, raw.bitLength());
  const upperBits = bits.slice(0, -32);
  const lowerBits = bits.slice(-32);
  const floatPart = lowerBits.split('').reduce((acc, bit, idx) => {
    acc = acc + (bit === '1' ? 1 / 2 ** (idx + 1) : 0);
    return acc;
  }, 0);
  const n = parseInt(upperBits, 2) + (raw.negative ? (-1 * floatPart) : floatPart);
  console.debug(raw, ('0b' + upperBits + '.' + lowerBits), n);
  return n;
}
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
