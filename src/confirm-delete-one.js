import Adw from "gi://Adw";
import GObject from "gi://GObject";

export const ConfirmDeleteOne = GObject.registerClass(
  {
    GTypeName: "ConfirmDeleteOne",
    Template: "resource:///org/mawa/mytest/confirm-delete-one.ui",
  },
  class ConfirmDeleteOne extends Adw.AlertDialog {
    constructor() {
      super();
    }
  }
);