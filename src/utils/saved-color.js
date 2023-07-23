import GObject from "gi://GObject";
import GLib from "gi://GLib";

/**
 * @param {string} id
 * @param {string} name
 * @param {string} hex
 * @param {string} rgb
 * @param {string} rgbPercent
 * @param {string} hsl
 * @param {string} hsv
 */
export const SavedColor = GObject.registerClass(
  {
    GTypeName: "SavedColor",
    Properties: {
      id: GObject.param_spec_variant(
        "id",
        "ID",
        "Picked color ID gVariantType datatyp",
        GLib.VariantType.new("s"),
        null,
        GObject.ParamFlags.READWRITE
      ),
      name: GObject.ParamSpec.string(
        "name",
        "Name",
        "Picked color name",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      hex: GObject.ParamSpec.string(
        "hex",
        "Hex",
        "Picked color in hexadecimal format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      rgb: GObject.ParamSpec.string(
        "rgb",
        "Rgb",
        "Picked color in RGB format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      rgbPercent: GObject.ParamSpec.string(
        "rgbPercent",
        "RgbPercent",
        "Picked color in RGB percent format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      hsl: GObject.ParamSpec.string(
        "hsl",
        "Hsl",
        "Picked color in HSL format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      hsv: GObject.ParamSpec.string(
        "hsv",
        "Hsv",
        "Picked color in HSV format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      visible: GObject.param_spec_variant(
        "visible",
        "Visible",
        "Visible color format in the picked color's page",
        GLib.VariantType.new("s"),
        null,
        GObject.ParamFlags.READWRITE
      ),
    },
  },
  class SavedColor extends GObject.Object {
    constructor({ id, name, hex, rgb, rgbPercent, hsl, hsv }) {
      super();
      this.id = GLib.Variant.new_string(id);
      this.name = name;
      this.hex = hex;
      this.rgb = rgb;
      this.rgbPercent = rgbPercent;
      this.hsl = hsl;
      this.hsv = hsv;
      this.visible = GLib.Variant.new_string(hex);

    }
  }
);
