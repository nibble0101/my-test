import GObject from "gi://GObject";

export const EvenNumbers = GObject.registerClass(
  {
    GTypeName: "EvenNumbers",
    Properties: {
      number: GObject.ParamSpec.int(
        "number",
        "Number",
        "Even Number",
        GObject.ParamFlags.READWRITE,
        0
      ),
    },
  },
  class EvenNumbers extends GObject.Object {
    constructor(number) {
      super();
      this.number = number;
    }
  }
);
