import Adw from "gi://Adw";
import GObject from "gi://GObject";
import GLib from "gi://GLib";

export const ConfirmDeleteAll = GObject.registerClass(
  {
    GTypeName: "ConfirmDeleteAll",
    Template: "resource:///io/github/josephmawa/bella/confirm-delete-all.ui",
  },
  class ConfirmDeleteAll extends Adw.AlertDialog {
    constructor() {
      super();
    }

    responseHandler(actionDialog, response) {
      if (response === "cancel") return;
      globalThis.deleteSavedColorsAction.activate(
        new GLib.Variant("s", response)
      );
    }
  }
);
