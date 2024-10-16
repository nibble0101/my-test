import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import GLib from "gi://GLib";

export const AlertDialog = GObject.registerClass(
  {
    GTypeName: "AlertDialog",
    Template: "resource:///org/mawa/mytest/alert-dialog.ui",
  },
  class AlertDialog extends Adw.AlertDialog {
    constructor() {
      super();
    }

    responseHandler(actionDialog, response) {
      if (response === "delete") {
        globalThis.deleteSavedColorsAction.activate(
          new GLib.Variant("s", response)
        );
      }
    }
  }
);
