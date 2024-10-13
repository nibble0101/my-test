/* application.js
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
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import GLib from "gi://GLib";

import { MyTestWindow } from "./window.js";

pkg.initGettext();
pkg.initFormat();

export const savedColorsFile = Gio.File.new_for_path(
  GLib.build_filenamev([
    GLib.get_user_config_dir(),
    "saved-colors",
    "saved-colors.json",
  ])
);

export const MyTestApplication = GObject.registerClass(
  class MyTestApplication extends Adw.Application {
    constructor() {
      super({
        application_id: pkg.name,
        flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
      });

      this.initActions();
    }

    vfunc_activate() {
      let { active_window } = this;

      if (!active_window) active_window = new MyTestWindow(this);

      active_window.present();
    }

    initActions = () => {
      const quitAction = new Gio.SimpleAction({ name: "quit" });
      quitAction.connect("activate", (action) => {
        this.quit();
      });
      this.add_action(quitAction);
      this.set_accels_for_action("app.quit", ["<primary>q"]);

      const aboutAction = new Gio.SimpleAction({ name: "about" });
      aboutAction.connect("activate", this.showAbout);
      this.add_action(aboutAction);
    };

    showAbout = () => {
      const builder = Gtk.Builder.new_from_resource(
        "/org/mawa/mytest/about-dialog.ui"
      );

      const aboutDialog = builder.get_object("about_dialog");
      aboutDialog.present(this.active_window);
    };
  }
);
