pkgdatadir = join_paths(get_option('datadir'), meson.project_name())
gnome = import('gnome')

src_gresource_file_path = 'gresources' / 'org.mawa.mytest.src.gresource.xml'
src_res = gnome.compile_resources( 'org.mawa.mytest.src',
  src_gresource_file_path,
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_gresource_file_path = 'gresources' / 'org.mawa.mytest.data.gresource.xml'
data_res = gnome.compile_resources('org.mawa.mytest.data',
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
bin_template_file_config_data.set('resource_path', '/org/mawa/mytest')

bin_template_file_path = 'bin-template' / 'org.mawa.mytest.in'
configure_file(
  input: bin_template_file_path,
  output: 'org.mawa.mytest',
  configuration: bin_template_file_config_data,
  install: true,
  install_dir: get_option('bindir')
)
