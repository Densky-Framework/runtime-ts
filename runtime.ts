import { UrlSerial } from "./types.ts";

export * from "./types.ts";
export * from "./http/request.ts";
export * from "./http/response.ts";
export * from "./http/error.ts";

function __matcher(
  serial: UrlSerial[],
  target: string[],
  paramMap: Map<string, string>,
  carrier: Map<string, string>,
) {
  for (let i = 0; i < serial.length; i++) {
    // Nullish protect
    if (!target[i]) return false;

    const serialParam = serial[i];
    const targetParam = target[i];

    if (serialParam.isVar) {
      carrier.set(serialParam.varname, targetParam);
    } else if (serialParam.raw !== targetParam) {
      return false;
    }
  }

  // Update accumulator
  for (const [key, value] of carrier) {
    paramMap.set(key, value);
  }

  return true;
}
export const matcherExact = (serial: UrlSerial[]) =>
(
  target: string[],
  paramMap: Map<string, string>,
  carrier: Map<string, string>,
) => {
  // Obvious exact
  if (target.length !== serial.length) return false;

  return __matcher(serial, target, paramMap, carrier);
};
export const matcherStart = (serial: UrlSerial[]) =>
(
  target: string[],
  paramMap: Map<string, string>,
  carrier: Map<string, string>,
) => {
  // less target length means that isn't exact or child
  if (target.length < serial.length) return false;

  return __matcher(serial, target, paramMap, carrier);
};
