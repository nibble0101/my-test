pkgdatadir = join_paths(get_option('datadir'), meson.project_name())
gnome = import('gnome')

src_gresource_file_path = 'gresources' / 'io.github.josephmawa.bella.src.gresource.xml'
src_res = gnome.compile_resources( 'io.github.josephmawa.bella.src',
  src_gresource_file_path,
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_gresource_file_path = 'gresources' / 'io.github.josephmawa.bella.data.gresource.xml'
data_res = gnome.compile_resources('io.github.josephmawa.bella.data',
  data_gresource_file_path,
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

bin_template_file_config_data = configuration_data()
bin_template_file_config_data.set('GJS', find_program('gjs').full_path())
bin_template_file_config_data.set('PACKAGE_VERSION', meson.project_version())
bin_template_file_config_data.set('PACKAGE_NAME', meson.project_name())
bin_template_file_config_data.set('prefix', get_option('prefix'))
bin_template_file_config_data.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_template_file_config_data.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))
bin_template_file_config_data.set('resource_path', '/io/github/josephmawa/bella')

bin_template_file_path = 'bin-template' / 'io.github.josephmawa.bella.in'
configure_file(
  input: bin_template_file_path,
  output: 'io.github.josephmawa.bella',
  configuration: bin_template_file_config_data,
  install: true,
  install_dir: get_option('bindir')
)
