#!/bin/bash

# Badehy Shell App Setup Script
# This script helps initialize the React Native project with iOS and Android support

set -e

echo "🚀 Setting up Badehy Shell App..."

# Check if React Native CLI is available
if ! command -v react-native &> /dev/null; then
    echo "❌ React Native CLI not found. Installing..."
    npm install -g @react-native-community/cli
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Check if we need to initialize native projects
if [ ! -d "ios" ] || [ ! -d "android" ]; then
    echo "⚠️  iOS or Android directories not found."
    echo "📱 You need to initialize the native projects."
    echo ""
    echo "Option 1: Use React Native CLI (Recommended)"
    echo "  npx @react-native-community/cli init BadehyShell --template react-native-template-typescript"
    echo "  Then copy the ios/ and android/ folders from the generated project."
    echo ""
    echo "Option 2: Create manually using Xcode and Android Studio"
    echo "  Follow the React Native documentation: https://reactnative.dev/docs/environment-setup"
    echo ""
    exit 1
fi

# Setup iOS
if [ -d "ios" ]; then
    echo "🍎 Setting up iOS..."
    cd ios
    
    if [ -f "Podfile" ]; then
        echo "📦 Installing CocoaPods dependencies..."
        pod install
    else
        echo "⚠️  Podfile not found. Creating one..."
        # Create basic Podfile
        cat > Podfile << EOF
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native/babel-preset/package.json'

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'BadehyShell' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  target 'BadehyShellTests' do
    inherit! :complete
  end

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
EOF
        pod install
    fi
    
    cd ..
fi

# Setup Android
if [ -d "android" ]; then
    echo "🤖 Android directory found. Ensure Android Studio is configured."
    echo "   Run 'npm run android' after starting an emulator."
fi

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update WEB_APP_URL in src/App.tsx with your web app URL"
echo "  2. For iOS: npm run ios"
echo "  3. For Android: npm run android"
echo ""

