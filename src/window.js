/* window.js
 *
 * Copyright 2023 Joseph Mawa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import Xdp from "gi://Xdp";
import GLib from "gi://GLib";

import { getColor, getHsv } from "./utils/utils.js";
import { Color } from "./utils/color.js";
import { SavedColor } from "./utils/saved-color.js";
import { MyPreferencesWindow } from "./preferences.js";
import { savedColorsFile } from "./application.js";

const xdpPortal = Xdp.Portal.new();
const colorFormats = ["name", "hex", "rgb", "rgb_percent", "hsl", "hsv"];

export const MyTestWindow = GObject.registerClass(
  {
    GTypeName: "MyTestWindow",
    Template: "resource:///org/mawa/mytest/window.ui",
    InternalChildren: [
      "pick_color_button",
      "main_stack",
      "back_to_home_page_button",
      "selection_model",
      "picked_color_display",
      "toast_overlay",
      "saved_colors_selection_model",
      "picked_colors_stack",
    ],
    Properties: {
      btn_label: GObject.ParamSpec.string(
        "btn_label",
        "btnLabel",
        "A simple button label",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      settings: GObject.ParamSpec.object(
        "settings",
        "Settings",
        "The main window settings",
        GObject.ParamFlags.READWRITE,
        Gio.Settings
      ),
    },
  },
  class MyTestWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });
      this.init();

      this._pick_color_button.connect("clicked", this.clickHandler);
      this._back_to_home_page_button.connect(
        "clicked",
        this.backToHomePageHandler
      );

      this.settings = Gio.Settings.new("org.mawa.mytest");
      this.settings.bind(
        "window-width",
        this,
        "default-width",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.settings.bind(
        "window-height",
        this,
        "default-height",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.settings.bind(
        "window-maximized",
        this,
        "maximized",
        Gio.SettingsBindFlags.DEFAULT
      );

      this.settings.connect(
        "changed::preferred-theme",
        this.setPreferredColorScheme
      );
      this.createActions();

      // Initialize when the app starts
      this.setPreferredColorScheme();
      this._selection_model.model = Gio.ListStore.new(Color);
      this._saved_colors_selection_model.model = Gio.ListStore.new(SavedColor);
      this.toast = new Adw.Toast({ timeout: 1 });
      this.getSavedColors();

      this._saved_colors_selection_model.model.bind_property_full(
        "n_items",
        this._picked_colors_stack,
        "visible-child-name",
        GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE,
        (_, numItems) => {
          const visiblePage = numItems
            ? "saved_colors_stack_page_inner"
            : "no_saved_colors_stack_page";
          return [true, visiblePage];
        },
        null
      );
    }

    vfunc_close_request() {
      const { model } = this._saved_colors_selection_model;
      const length = model.get_n_items();

      const pickedColors = [];

      for (let idx = 0; idx < length; idx++) {
        const item = model.get_item(idx);
        const pickedColor = { id: item.id.unpack() };

        for (const format of colorFormats) {
          pickedColor[format] = item[format];
        }

        pickedColors.push(pickedColor);
      }

      this.saveData(pickedColors);
    }

    init = () => {
      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_resource("org/mawa/mytest/styles/index.css");

      Gtk.StyleContext.add_provider_for_display(
        this.display,
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_USER
      );
    };

    createActions = () => {
      const copyColorAction = new Gio.SimpleAction({
        name: "copy-color",
        parameterType: GLib.VariantType.new("s"),
      });

      const showPreferencesWindowAction = new Gio.SimpleAction({
        name: "preferences",
      });

      const copySavedColorAction = new Gio.SimpleAction({
        name: "copy-saved-color",
        parameterType: GLib.VariantType.new("s"),
      });

      const deleteSavedColorAction = new Gio.SimpleAction({
        name: "delete-saved-color",
        parameterType: GLib.VariantType.new("s"),
      });

      const viewSavedColorAction = new Gio.SimpleAction({
        name: "view-saved-color",
        parameterType: GLib.VariantType.new("s"),
      });

      copyColorAction.connect("activate", (_, color) => {
        const colorStr = color?.unpack();

        if (colorStr) {
          this.copyToClipboard(colorStr);
          this.displayToast(`Copied ${colorStr} to clipoard`);
        }
      });

      showPreferencesWindowAction.connect("activate", () => {
        const preferencesWindow = new MyPreferencesWindow({
          application: this.application,
        });

        preferencesWindow.set_transient_for(this);
        preferencesWindow.present();
      });

      copySavedColorAction.connect("activate", (_, savedColor) => {
        const color = savedColor?.unpack();

        if (color) {
          this.copyToClipboard(color);
          this.displayToast(`Copied ${color} to clipboard`);
        }
      });

      deleteSavedColorAction.connect("activate", (_, colorId) => {
        const id = colorId?.unpack();
        const [idx, item] = this.getItem(id);

        if (idx === null) {
          throw new Error(`id: ${id} is non-existent`);
        }

        this._saved_colors_selection_model.model.remove(idx);
        this.displayToast("Deleted saved color successfully");
      });

      viewSavedColorAction.connect("activate", (_, colorId) => {
        const id = colorId?.unpack();
        const [idx, item] = this.getItem(id);

        if (idx === null) {
          throw new Error(`id: ${id} is non-existent`);
        }

        this.updatePickedColor(item);

        const css = `.picked-color-display{ background-color: ${item.rgb}; }`;

        const cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_data(css, -1);

        this._main_stack.visible_child_name = "picked_color_page";

        const styleContext = this._picked_color_display.get_style_context();
        styleContext.add_provider(
          cssProvider,
          Gtk.STYLE_PROVIDER_PRIORITY_USER
        );
      });

      // Window-scoped actions
      this.add_action(copyColorAction);
      this.add_action(copySavedColorAction);
      this.add_action(deleteSavedColorAction);
      this.add_action(viewSavedColorAction);

      // Application-scoped actions
      this.application.add_action(showPreferencesWindowAction);
    };

    clickHandler = () => {
      const cancellable = Gio.Cancellable.new();

      /**
       * Beware the pick color operation will fail if the
       * user fails to pick color within 24 - 25 seconds.
       * This could be because the operation is being timed
       * internally. Not very sure what's happening here.
       *
       * There's need to dig deeper. Even if the operation
       * fails, control is not handed back to the application
       * until the user clicks somewhere.
       */

      xdpPortal.pick_color(null, cancellable, (source_object, result) => {
        try {
          const gVariant = xdpPortal.pick_color_finish(result);

          const scaledRgb = [0, 0, 0];

          for (let i = 0; i < scaledRgb.length; i++) {
            scaledRgb[i] = gVariant.get_child_value(i).get_double();
          }

          const { name, rgb, rgb_percent, hex, hsl } = getColor(scaledRgb);
          const hsv = getHsv(Gtk.rgb_to_hsv(...scaledRgb));

          const pickedColor = {
            id: GLib.uuid_string_random(),
            name,
            hex,
            rgb,
            rgb_percent,
            hsv,
            hsl,
          };

          this.updatePickedColor(pickedColor);
          this.updateSavedColors(pickedColor);

          const css = `.picked-color-display{ background-color: ${rgb}; }`;

          const cssProvider = new Gtk.CssProvider();
          cssProvider.load_from_data(css, -1);

          this._main_stack.visible_child_name = "picked_color_page";

          const styleContext = this._picked_color_display.get_style_context();
          styleContext.add_provider(
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER
          );
        } catch (err) {
          if (err instanceof GLib.Error) {
            if (err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.FAILED)) {
              console.log("Failed to pick color ");
              this.displayToast("Failed to pick color");
              return;
            }
          }
          console.log(err);
        }
      });
    };

    backToHomePageHandler = () => {
      this._main_stack.visible_child_name = "main_page";
    };

    setPreferredColorScheme = () => {
      const preferredColorScheme = this.settings.get_string("preferred-theme");
      const { DEFAULT, FORCE_LIGHT, FORCE_DARK } = Adw.ColorScheme;
      let colorScheme = DEFAULT;

      if (preferredColorScheme === "system") {
        colorScheme = DEFAULT;
      }

      if (preferredColorScheme === "light") {
        colorScheme = FORCE_LIGHT;
      }

      if (preferredColorScheme === "dark") {
        colorScheme = FORCE_DARK;
      }

      this.application.get_style_manager().color_scheme = colorScheme;
    };

    getSavedColors = () => {
      const filePath = savedColorsFile.get_path();
      const fileExists = GLib.file_test(filePath, GLib.FileTest.EXISTS);

      if (fileExists) {
        const [success, arrBuff] = GLib.file_get_contents(filePath);

        if (success) {
          const decoder = new TextDecoder("utf-8");
          const pickedColors = JSON.parse(decoder.decode(arrBuff));

          const { model } = this._saved_colors_selection_model;

          for (const pickedColor of pickedColors) {
            model.append(new SavedColor(pickedColor));
          }
        } else {
          console.log("Failed to read saved data");
        }

        return;
      }

      console.log("File doesn't exist yet");
    };

    saveData = (data = []) => {
      const fileCreationFlag = GLib.mkdir_with_parents(
        savedColorsFile.get_parent().get_path(),
        0o777 // File permission, ugo+rwx, in numeric mode
      );

      if (fileCreationFlag === 0) {
        const [success, tag] = savedColorsFile.replace_contents(
          JSON.stringify(data),
          null,
          false,
          Gio.FileCreateFlags.REPLACE_DESTINATION,
          null
        );

        if (success) {
          console.log("Successfully saved picked colors to file");
        } else {
          console.log("Failed to save picked colors to file");
        }
      }

      if (fileCreationFlag === -1) {
        console.log("An error occurred while creating directory");
      }
    };

    displayToast = (message) => {
      this.toast.dismiss();
      this.toast.title = message;
      this._toast_overlay.add_toast(this.toast);
    };

    copyToClipboard = (text) => {
      const clipboard = this.display.get_clipboard();
      const contentProvider = Gdk.ContentProvider.new_for_value(text);
      clipboard.set_content(contentProvider);
    };

    getItem = (id) => {
      const { model } = this._saved_colors_selection_model;
      const length = model.get_n_items();

      for (let idx = 0; idx < length; idx++) {
        const item = model.get_item(idx);

        if (item.id.unpack() === id) {
          return [idx, item];
        }
      }

      return [null, null];
    };

    updateSavedColors = (pickedColor = {}) => {
      const { model } = this._saved_colors_selection_model;
      model.append(new SavedColor(pickedColor));
    };

    updatePickedColor = (pickedColor = {}) => {
      const { model } = this._selection_model;
      model.remove_all();

      for (const format of colorFormats) {
        model.append(new Color(format, pickedColor[format]));
      }
    };
  }
);
