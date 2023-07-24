export function getColor(scaledRgb) {
  const rgb = [],
    hex = [],
    rgb_percent = [];

  for (const value of scaledRgb) {
    rgb.push(Math.round(value * 255));
    hex.push(
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0")
    );
    rgb_percent.push(`${Math.round(value * 100)}%`);
  }

  return {
    name: 'Yellow',
    hex: `#${hex.join("").toUpperCase()}`,
    rgb: `rgb(${rgb.join(", ")})`,
    hsl: `hsv(${rgb.join(", ")})`, // FIXME
    rgb_percent: `rgb(${rgb_percent.join(", ")})`,
  };
}

export function getHsv([hue, saturation, value]) {
  const scaledHue = Math.round(hue * 360);
  const scaledSaturation = Math.round(saturation * 100);
  const scaledValue = Math.round(value * 100);

  return `hsv(${scaledHue}, ${scaledSaturation}, ${scaledValue})`;
}
