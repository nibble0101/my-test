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
import Adw from "gi://Adw?version=1";
import GLib from "gi://GLib";
import system from "system";

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

const URL = 'https://www.github.com/nibble0101/'

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
      const quit_action = new Gio.SimpleAction({ name: "quit" });
      quit_action.connect("activate", (action) => {
        this.quit();
      });
      this.add_action(quit_action);
      this.set_accels_for_action("app.quit", ["<primary>q"]);

      const show_about_action = new Gio.SimpleAction({ name: "about" });
      show_about_action.connect("activate", this.showAbout);
      this.add_action(show_about_action);
    };

    showAbout = () => {
      const aboutWindow = new Adw.AboutWindow({
        transient_for: this.active_window,
        application_icon: pkg.name,
        license_type: Gtk.License.GPL_3_0_ONLY,
        version: pkg.version,
        application_name: "Color Buddy",
        developer_name: "Joseph Mawa",
        developers: [`Joseph Mawa ${URL}`],
        documenters: [`Joseph Mawa ${URL}`],
        copyright: "Copyright © 2023 Joseph Mawa",
        website: `${URL}/color-buddy`,
        issue_url: `${URL}/color-buddy/issues`,
        support_url: `${URL}/color-buddy/issues`,
        translator_credits: _(
          `Jane Doe <doe@gmail.com>
          John Doe <john@gmail.com>`
        ),
      });
      aboutWindow.present();
    };
  }
);
