import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import { AlertDialog } from "./alert-dialog.js";

export const MyPreferencesWindow = GObject.registerClass(
  {
    GTypeName: "MyPreferencesWindow",
    Template: "resource:///org/mawa/mytest/preferences.ui",
    InternalChildren: ["system", "dark", "light", "colorFormatSettings"],
    Properties: {
      theme: GObject.ParamSpec.string(
        "theme",
        "Theme",
        "Preferred theme",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      colorFormat: GObject.ParamSpec.string(
        "colorFormat",
        "color_format",
        "Color format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
    },
  },
  class MyPreferencesWindow extends Adw.PreferencesWindow {
    constructor(options = {}) {
      super(options);

      this.settings = Gio.Settings.new("org.mawa.mytest");
      this.settings.bind(
        "preferred-theme",
        this,
        "theme",
        Gio.SettingsBindFlags.DEFAULT
      );

      this.settings.bind(
        "color-format",
        this,
        "colorFormat",
        Gio.SettingsBindFlags.DEFAULT
      );

      this.bind_property_full(
        "theme",
        this._system,
        "active",
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
        (_, theme) => [true, theme === "system"],
        (_, theme) => [theme, "system"]
      );

      this.bind_property_full(
        "theme",
        this._light,
        "active",
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
        (_, theme) => [true, theme === "light"],
        (_, theme) => [theme, "light"]
      );

      this.bind_property_full(
        "theme",
        this._dark,
        "active",
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
        (_, theme) => [true, theme === "dark"],
        (_, theme) => [theme, "dark"]
      );

      this.bind_property_full(
        "colorFormat",
        this._colorFormatSettings,
        "selected",
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE,
        (_, colorFormat) => {
          const model = this._colorFormatSettings.model;

          for (let i = 0; i < model.get_n_items(); i++) {
            const stringObject = model.get_item(i);

            if (stringObject?.string === colorFormat) {
              return [true, i];
            }
          }
          return [false, 0];
        },
        (_, selected) => {
          const stringObject =
            this._colorFormatSettings.model.get_item(selected);

          if (stringObject?.string) {
            return [true, stringObject.string];
          }

          return [false, "RGB"];
        }
      );
    }

    deleteSavedColors() {
      const alertDialog = new AlertDialog();
      alertDialog.present(this);
    }
  }
);
