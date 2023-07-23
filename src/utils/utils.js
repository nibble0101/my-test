export function getColor(scaledRgb) {
  const rgb = [],
    rgbHex = [],
    rgbPercent = [];

  for (const value of scaledRgb) {
    rgb.push(Math.round(value * 255));
    rgbHex.push(
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0")
    );
    rgbPercent.push(`${Math.round(value * 100)}%`);
  }

  return {
    rgb: `rgb(${rgb.join(", ")})`,
    rgbHex: `#${rgbHex.join("").toUpperCase()}`,
    rgbPercent: `rgb(${rgbPercent.join(", ")})`,
  };
}

export function getHsv([hue, saturation, value]) {
  const scaledHue = Math.round(hue * 360);
  const scaledSaturation = Math.round(saturation * 100);
  const scaledValue = Math.round(value * 100);

  return `hsv(${scaledHue}, ${scaledSaturation}, ${scaledValue})`;
}
