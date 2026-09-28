#!/bin/bash
set -e

APP_ROOT="$(pwd)"
echo "=== Building Modern Android 14+ Compatible APK ==="
echo "App root: $APP_ROOT"

BUILD_DIR="/tmp/apk_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/org/quran/hifz60"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-mdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/gen"

# Copy icons
cp "$APP_ROOT/public/icon-192.png" "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp "$APP_ROOT/public/icon-192.png" "$BUILD_DIR/res/mipmap-mdpi/ic_launcher.png"
cp "$APP_ROOT/public/icon-512.png" "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp "$APP_ROOT/public/icon-512.png" "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
cp "$APP_ROOT/public/icon-512.png" "$BUILD_DIR/res/mipmap-xxxhdpi/ic_launcher.png"

# Copy web assets into assets/web
cp -r "$APP_ROOT/dist" "$BUILD_DIR/assets/web"

# 2. Write AndroidManifest.xml targeted to Android 14 (API 34) and compatible with Android 15
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.quran.hifz60"
    android:versionCode="2"
    android:versionName="1.1.0">

    <uses-sdk 
        android:minSdkVersion="24" 
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="org.quran.hifz60.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 3. Write Strings
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">منظومة حفظ الستين</string>
</resources>
EOF

# 4. Write MainActivity.java (Modern Android WebView configuration)
cat << 'EOF' > "$BUILD_DIR/src/org/quran/hifz60/MainActivity.java"
package org.quran.hifz60;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        // Load offline application
        webView.loadUrl("file:///android_asset/web/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

ANDROID_JAR="/opt/android-sdk/platforms/android-34/android.jar"

echo "=== Step 1: Compiling Resources with AAPT ==="
aapt package -m -J "$BUILD_DIR/gen" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

echo "=== Step 2: Compiling Java with javac (Java 8 bytecode target) ==="
/usr/lib/jvm/java-17-openjdk-amd64/bin/javac \
    -source 1.8 -target 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -d "$BUILD_DIR/bin" \
    "$BUILD_DIR/gen/org/quran/hifz60/R.java" \
    "$BUILD_DIR/src/org/quran/hifz60/MainActivity.java"

echo "=== Step 3: Modern DEX Compilation with Google D8 (min-api 24, target 34) ==="
CLASS_FILES=$(find "$BUILD_DIR/bin" -name "*.class")
java -cp /opt/r8.jar com.android.tools.r8.D8 \
    --min-api 24 \
    --lib "$ANDROID_JAR" \
    --output "$BUILD_DIR/bin" \
    $CLASS_FILES

echo "=== Step 4: Packaging APK ==="
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/bin/unaligned.apk"

cd "$BUILD_DIR/bin"
aapt add unaligned.apk classes.dex
cd "$APP_ROOT"

echo "=== Step 5: 4-byte ZipAlign ==="
zipalign -f -v -p 4 "$BUILD_DIR/bin/unaligned.apk" "$BUILD_DIR/bin/aligned.apk"

echo "=== Step 6: Keystore and Signing with apksigner (v1 + v2 + v3 schemes) ==="
KEYSTORE="/tmp/apk_build/debug.keystore"
keytool -genkey -v -keystore "$KEYSTORE" \
    -alias androiddebugkey \
    -storepass android -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"

apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --min-sdk-version 24 \
    --max-sdk-version 34 \
    --out "$APP_ROOT/public/Hifz60-release.apk" \
    "$BUILD_DIR/bin/aligned.apk"

cp "$APP_ROOT/public/Hifz60-release.apk" "$APP_ROOT/public/hifz60.apk"

echo "=== Step 7: Verifying Signed APK for Android 14+ Compatibility ==="
apksigner verify --verbose "$APP_ROOT/public/Hifz60-release.apk"
aapt dump badging "$APP_ROOT/public/Hifz60-release.apk" | grep -E "package|sdkName|targetSdkVersion|launchable-activity"
ls -lh "$APP_ROOT/public/Hifz60-release.apk"
echo "=== MODERN APK BUILD SUCCESSFUL ==="
