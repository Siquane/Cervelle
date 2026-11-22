// Point d'entrée : l'appli (expo-router) et, sur Android, les widgets de
// l'écran d'accueil, qui tournent même quand l'appli est fermée.
import "expo-router/entry";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler, registerWidgetConfigurationScreen } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widgets/handler");
  const { WidgetConfigScreen } = require("./src/widgets/ConfigScreen");
  registerWidgetTaskHandler(widgetTaskHandler);
  // Choix du style (couleur, clair, sombre) en posant ou en réglant un widget.
  registerWidgetConfigurationScreen(WidgetConfigScreen);
}
