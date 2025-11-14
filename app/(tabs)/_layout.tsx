import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 3,
          }}
        >
          <LinearGradient
            colors={["rgba(171, 139, 255, 0.25)", "rgba(106, 76, 255, 0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 20,
            }}
          />
          <Image
            source={icon}
            tintColor="#AB8BFF"
            style={{ width: 20, height: 20 }}
          />
        </View>
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: "#AB8BFF",
            marginTop: 1,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Image
        source={icon}
        tintColor="#D6C7FF"
        style={{ width: 20, height: 20, opacity: 0.6 }}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        // REMOVE THIS LINE - tabBarIndicatorStyle doesn't exist in Expo Router Tabs
        // tabBarIndicatorStyle: {
        //   height: 0,
        //   width: 0,
        // },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 8,
          paddingHorizontal: 4,
          flex: 1,
        },
        tabBarStyle: {
          backgroundColor: "rgba(15, 13, 35, 0.85)",
          borderRadius: 28,
          marginHorizontal: 20,
          marginBottom: 32,
          height: 64,
          position: "absolute",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(171, 139, 255, 0.2)",
          shadowColor: "#AB8BFF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home", // Changed from "index" to "Home" for better semantics
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Search" />
          ),
        }}
      />

      <Tabs.Screen
        name="save"
        options={{
          title: "Save",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="Save" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
