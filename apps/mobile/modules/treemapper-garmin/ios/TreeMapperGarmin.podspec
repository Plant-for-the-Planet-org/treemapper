require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'TreeMapperGarmin'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = { :type => 'Proprietary' }
  s.author         = 'Plant-for-the-Planet'
  s.homepage       = 'https://github.com/Plant-for-the-Planet-org/treemapper'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # The Connect IQ Mobile SDK, committed under vendor/.
  #
  # It is a dynamic framework, so CocoaPods links it here and embeds it into
  # the app in the "[CP] Embed Pods Frameworks" phase. Garmin publishes it as a
  # Swift package at github.com/garmin/connectiq-companion-app-sdk-ios, which
  # CocoaPods cannot consume, and there is no pod for it. Vendoring the
  # xcframework is 1.7 MB and keeps a clean clone buildable offline.
  # vendor/SDK_VERSION records which release this is.
  s.vendored_frameworks = 'vendor/ConnectIQ.xcframework'

  # Garmin's own setup guide asks for -ObjC: the framework uses Objective-C
  # categories, and without the flag their implementations can be dropped at
  # link time.
  s.user_target_xcconfig = { 'OTHER_LDFLAGS' => '-ObjC' }

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  # Only this folder, and no exclude_files.
  #
  # The glob is already flat, so the vendored framework's own headers are out
  # of reach and cannot be compiled twice. Do not "tidy" this by adding
  # `s.exclude_files = 'vendor/**/*'`: CocoaPods applies exclude_files to every
  # file attribute, not just source_files, so that pattern also removes
  # vendor/ConnectIQ.xcframework from vendored_frameworks. The pod then
  # installs with no framework search path at all and GarminLink.swift fails
  # with "No such module 'ConnectIQ'".
  s.source_files = '*.{h,m,mm,swift}'
end
