// Universal stub for native modules (react-native, expo-*, react-native-*).
// Lets us load game generators in plain Node without a device runtime.
// Any property access returns the same callable proxy; the few APIs that games
// touch at module-eval time (StyleSheet.create, Dimensions.get, Platform.*)
// get real-ish values so top-level layout math doesn't blow up.
const proxy = new Proxy(function () {}, {
  get(_t, prop) {
    switch (prop) {
      case 'create':
      case 'flatten':
        return (s) => s;
      case 'get':
        return () => ({ width: 400, height: 800, scale: 2, fontScale: 1 });
      case 'roundToNearestPixel':
        return (n) => n;
      case 'select':
        return (o) => (o ? o.default ?? o.web ?? o.native ?? o.ios ?? o.android : undefined);
      case 'OS':
        return 'web';
      case 'Version':
        return 0;
      case '__esModule':
        return true;
      case 'default':
        return proxy;
      case Symbol.toPrimitive:
        return () => 0;
      default:
        return proxy;
    }
  },
  apply() {
    return proxy;
  },
});

module.exports = proxy;
