import { bnToU8a } from '@polkadot/util';
import { stringToDegree } from '@encointer/types/index.d.ts';

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

export function ipfsCidFromHex (ipfsCidHex) {
  const ipfsCidNoPrefix = (ipfsCidHex.toString()).split('x')[1];
  // converts from hex to string
  let ipfsCid = '';
  for (let n = 0; n < ipfsCidNoPrefix.length; n += 2) {
    ipfsCid += String.fromCharCode(parseInt(ipfsCidNoPrefix.substr(n, 2), 16));
  }
  return ipfsCid;
}

/**
 * Parses a location json with fields as number strings to a `Location` object.
 *
 * There is a rust vs. JS endian issue with numbers: https://github.com/polkadot-js/api/issues/4313.
 *
 * tl;dr: If the returned location is processed:
 *  * by a node (rust), use isLe = false.
 *  * by JS, e.g. `parseDegree`, use isLe = true.
 *
 *
 * @param api
 * @param location fields as strings, e.g. '35.2313515312'
 * @param isLe
 * @returns {Location} Location with fields as fixed-point numbers
 */
export function locationFromJson (api, location, isLe = true) {
  return api.createType('Location', {
    lat: bnToU8a(stringToDegree(location.lat), 128, isLe),
    lon: bnToU8a(stringToDegree(location.lon), 128, isLe)
  });
}
