// Point d'entrée : l'appli (expo-router) et, sur Android, les widgets de
// l'écran d'accueil, qui tournent même quand l'appli est fermée.
import "expo-router/entry";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widgets/handler");
  registerWidgetTaskHandler(widgetTaskHandler);
}
