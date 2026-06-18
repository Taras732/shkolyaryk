// ESM stub for native modules. esbuild can't synthesize arbitrary named
// exports from a CJS Proxy, so we export an explicit (generous) union of the
// names react-native / react-native-svg / expo-* expose, all pointing at one
// permissive proxy. StyleSheet.create / Dimensions.get / Platform.* return
// real-ish values so module-eval-time layout math doesn't throw.
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

export default proxy;

// react-native
export const View = proxy, Text = proxy, StyleSheet = proxy, Pressable = proxy,
  TouchableOpacity = proxy, TouchableWithoutFeedback = proxy, TouchableHighlight = proxy,
  ScrollView = proxy, Image = proxy, ImageBackground = proxy, Modal = proxy,
  FlatList = proxy, SectionList = proxy, ActivityIndicator = proxy, Dimensions = proxy,
  Platform = proxy, Animated = proxy, Easing = proxy, PanResponder = proxy,
  Keyboard = proxy, KeyboardAvoidingView = proxy, SafeAreaView = proxy, StatusBar = proxy,
  AppState = proxy, Linking = proxy, Alert = proxy, Vibration = proxy, BackHandler = proxy,
  LayoutAnimation = proxy, UIManager = proxy, PixelRatio = proxy, I18nManager = proxy,
  AccessibilityInfo = proxy, RefreshControl = proxy, TextInput = proxy, Switch = proxy,
  Button = proxy, useWindowDimensions = () => ({ width: 400, height: 800, scale: 2, fontScale: 1 }),
  useColorScheme = () => 'light', findNodeHandle = () => null, NativeModules = proxy;

// react-native-svg
export const Svg = proxy, Circle = proxy, Rect = proxy, Ellipse = proxy, Polygon = proxy,
  Polyline = proxy, Path = proxy, G = proxy, Line = proxy, TSpan = proxy, Defs = proxy,
  Stop = proxy, LinearGradient = proxy, RadialGradient = proxy, ClipPath = proxy,
  Use = proxy, Mask = proxy, Pattern = proxy, Symbol_ = proxy;
export { proxy as Symbol };
// react-native-svg exports `Text` too — alias it via SvgText is handled by import-as.

// expo-* / @expo/vector-icons (common)
export const Ionicons = proxy, MaterialCommunityIcons = proxy, MaterialIcons = proxy,
  FontAwesome = proxy, Feather = proxy, AntDesign = proxy, Audio = proxy, Haptics = proxy,
  useRouter = () => proxy, useLocalSearchParams = () => ({}), Link = proxy, router = proxy;
