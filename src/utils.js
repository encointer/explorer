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
