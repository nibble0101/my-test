import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

export const MyPreferencesWindow = GObject.registerClass(
  {
    GTypeName: "MyPreferencesWindow",
    Template: "resource:///org/mawa/mytest/preferences.ui",
    InternalChildren: ["system", "dark", "light"],
    Properties: {
      theme: GObject.ParamSpec.string(
        "theme",
        "Theme",
        "Preferred theme",
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
    }
  }
);
