# APK 打包说明（横屏）

以下步骤在 Windows + Android Studio 环境验证思路可行。

## 1) 准备环境

- 安装 Node.js LTS
- 安装 Android Studio（含 SDK / Build Tools）
- 在项目目录执行：

```bash
npm init -y
npm i @capacitor/core @capacitor/cli
npx cap init PocketFarm cn.demo.pocketfarm --web-dir=.
npx cap add android
```

## 2) 强制横屏

编辑 `android/app/src/main/AndroidManifest.xml`，给 `MainActivity` 添加：

```xml
android:screenOrientation="landscape"
```

示例：

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:screenOrientation="landscape"
    ... >
```

## 3) 同步前端资源

```bash
npx cap copy android
```

## 4) 打开 Android Studio 打包

```bash
npx cap open android
```

在 Android Studio 中：

- `Build > Build Bundle(s) / APK(s) > Build APK(s)`
- 输出目录通常在：
  - `android/app/build/outputs/apk/debug/app-debug.apk`
  - 或 release 目录（签名后）

## 5) 可选：命令行生成 Debug APK

```bash
cd android
./gradlew assembleDebug
```

Windows 下可用：

```bash
gradlew.bat assembleDebug
```

