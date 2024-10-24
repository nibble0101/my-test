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

import { getColor, getHsv, colorFormats } from "./utils/utils.js";
import { Color } from "./utils/color.js";
import { SavedColor } from "./utils/saved-color.js";
import { MyPreferencesDialog } from "./preferences.js";
import { savedColorsFile } from "./application.js";
import { ConfirmDeleteOne } from "./confirm-delete-one.js";

const xdpPortal = Xdp.Portal.new();

export const BellaWindow = GObject.registerClass(
  {
    GTypeName: "BellaWindow",
    Template: "resource:///io/github/josephmawa/bella/window.ui",
    InternalChildren: [
      "pick_color_button",
      "main_stack",
      "back_to_home_page_button",
      "selection_model",
      "colorDialogBtn",
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
      color_format: GObject.ParamSpec.string(
        "color_format",
        "colorFormat",
        "Selected color format",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      visible_color_id: GObject.ParamSpec.string(
        "visible_color_id",
        "visibleColorId",
        "Id of the color visible on the details page",
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
  class BellaWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });
      this.init();

      this._pick_color_button.connect("clicked", this.clickHandler);
      this._back_to_home_page_button.connect(
        "clicked",
        this.backToHomePageHandler
      );

      this.settings = Gio.Settings.new("io.github.josephmawa.bella");
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

      this.settings.bind(
        "color-format",
        this,
        "color_format",
        Gio.SettingsBindFlags.GET
      );

      // Color theme settings
      this.settings.connect(
        "changed::preferred-theme",
        this.setPreferredColorScheme
      );

      // Color format settings
      this.settings.connect("changed::color-format", this.updateColorFormat);

      // Create actions
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

        for (const { key } of colorFormats) {
          pickedColor[key] = item[key];
        }

        pickedColors.push(pickedColor);
      }

      this.saveData(pickedColors);
    }

    init = () => {
      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_resource("io/github/josephmawa/bella/styles/index.css");

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

      const deleteSavedColorsAction = new Gio.SimpleAction({
        name: "delete-saved-colors",
        parameterType: GLib.VariantType.new("s"),
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
        const preferencesWindow = new MyPreferencesDialog();

        preferencesWindow.present(this);
      });

      deleteSavedColorsAction.connect("activate", (_, alertDialogResponse) => {
        const response = alertDialogResponse?.unpack();

        if (response === "delete") {
          this._saved_colors_selection_model.model.remove_all();
          this.saveData([]);
          this.displayToast("Deleted all saved colors");
        }
      });

      copySavedColorAction.connect("activate", (_, savedColor) => {
        const color = savedColor?.unpack();

        if (color) {
          this.copyToClipboard(color);
          this.displayToast(`Copied ${color} to clipboard`);
        }
      });

      deleteSavedColorAction.connect("activate", (_, colorId) => {
        const confirmDeleteOne = new ConfirmDeleteOne();

        confirmDeleteOne.connect("response", (actionDialog, response) => {
          if (response === "cancel") return;

          const id = colorId?.unpack();
          const [idx, item] = this.getItem(id);

          if (idx === null) {
            throw new Error(`id: ${id} is non-existent`);
          }

          this._saved_colors_selection_model.model.remove(idx);
          this.displayToast("Deleted saved color successfully");
        });

        confirmDeleteOne.present(this);
      });

      viewSavedColorAction.connect("activate", (_, colorId) => {
        const id = colorId?.unpack();
        const [idx, item] = this.getItem(id);

        if (idx === null) {
          throw new Error(`id: ${id} is non-existent`);
        }

        this.updatePickedColor(item);
        this._main_stack.visible_child_name = "picked_color_page";

        const color = new Gdk.RGBA();
        color.parse(item.rgb);

        this._colorDialogBtn.set_rgba(color);
      });

      // Window-scoped actions
      this.add_action(copyColorAction);
      this.add_action(copySavedColorAction);
      this.add_action(deleteSavedColorAction);
      this.add_action(viewSavedColorAction);

      // Application-scoped actions
      this.application.add_action(deleteSavedColorsAction);
      this.application.add_action(showPreferencesWindowAction);

      // Add it to gloabThis so that it is triggered from a modal
      globalThis.deleteSavedColorsAction = deleteSavedColorsAction;
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
          this.addNewColor(pickedColor);

          this._main_stack.visible_child_name = "picked_color_page";
          const color = new Gdk.RGBA();
          color.parse(pickedColor.rgb);

          this._colorDialogBtn.set_rgba(color);
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

    selectColorHandler(colorDialogBtn) {
      const scaledRgb = [
        colorDialogBtn.rgba.red,
        colorDialogBtn.rgba.green,
        colorDialogBtn.rgba.blue,
      ];

      const colorObject = getColor(scaledRgb);
      colorObject.hsv = getHsv(Gtk.rgb_to_hsv(...scaledRgb));

      const model = this._selection_model.model;
      let isSameColor = true;

      for (let i = 0; i < model.get_n_items(); i++) {
        const item = model.get_item(i);
        if (item.color === colorObject[item.key]) {
          continue;
        }

        isSameColor = false;
        break;
      }

      if (isSameColor) return;

      colorObject.id = this.visible_color_id;
      this.updatePickedColor(colorObject);
      this.updateSavedColor(colorObject);
    }

    backToHomePageHandler = () => {
      this._main_stack.visible_child_name = "main_page";
      this.visible_color_id = "";
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

    updateColorFormat = () => {
      const model = this._saved_colors_selection_model.model;

      for (let i = 0; i < model.get_n_items(); i++) {
        const item = model.get_item(i);
        const itemClone = { id: item.id.unpack() };

        for (const { key } of colorFormats) {
          itemClone[key] = item[key];
        }

        model.splice(i, 1, [new SavedColor(itemClone, this.color_format)]);
      }
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
            model.append(new SavedColor(pickedColor, this.color_format));
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

    addNewColor = (pickedColor = {}) => {
      const { model } = this._saved_colors_selection_model;
      model.append(new SavedColor(pickedColor, this.color_format));
    };

    updateSavedColor = (pickedColor = {}) => {
      const model = this._saved_colors_selection_model.model;

      for (let i = 0; i < model.get_n_items(); i++) {
        const item = model.get_item(i);
        if (item.id.unpack() === pickedColor.id) {
          const newColor = new SavedColor(pickedColor, this.color_format);
          model.splice(i, 1, [newColor]);
        }
      }
    };

    updatePickedColor = (pickedColor = {}) => {
      const model = this._selection_model.model;
      const { id } = pickedColor;
      this.visible_color_id = typeof id === "string" ? id : id.unpack();

      model.remove_all();

      for (const { key, description } of colorFormats) {
        model.append(new Color(description, pickedColor[key], key));
      }
    };
  }
);
