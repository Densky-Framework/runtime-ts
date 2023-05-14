import * as __colors from "https://deno.land/std@0.187.0/fmt/colors.ts";

const {
  getColorEnabled,
  setColorEnabled,
  rgb8,
  rgb24,
  bgRgb8,
  bgRgb24,
  ..._colors
} = __colors;
type _Colors = typeof _colors;

export { bgRgb24, bgRgb8, getColorEnabled, rgb24, rgb8, setColorEnabled };

function colors(s: TemplateStringsArray, ...args: unknown[]): string;
function colors(...s: unknown[]): string;
function colors(s: TemplateStringsArray | unknown, ...args: unknown[]): string {
  if (Array.isArray(s)) {
    return s.reduce((p, a, i) => p + (a ?? "") + (String(args[i] ?? "")), "");
  } else {
    return String(s) + args.join("");
  }
}

type EnchantedColors = {
  [s in keyof _Colors]: typeof colors;
};

const $colors = Object.entries(_colors).reduce((p, a) => {
  p[a[0] as keyof _Colors] = (...args: any[]) => a[1](colors(...args));
  return p;
}, {} as EnchantedColors);

export default $colors;
