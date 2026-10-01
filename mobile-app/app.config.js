export default {
  expo: {
    name: "customer-app",
    slug: "customer-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.instacome.customer",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      ],
      "expo-location"
    ],
    extra: {
      eas: {
        projectId: "d9d2ff5b-609e-475e-9a4b-cca6d3afc259"
      }
    }
  }
};
