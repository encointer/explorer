/// Function to convert fixedpoint SCALE-encoded to Number
/// raw: substrate_fixed::types::I32F32 as I64
export function parseFixPoint (raw) {
    // FIXME small brain fixpoint to Number conversion
    let bits = raw.toString(2, 64);
    console.debug('0b', bits);
    return parseInt(bits.slice(0, -31), 2);
}
