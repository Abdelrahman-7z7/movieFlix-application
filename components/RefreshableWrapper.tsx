import React, { useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";

interface RefreshableWrapperProps {
  children: React.ReactNode;
  refreshing?: boolean;
  loading?: boolean;
  indicatorColor?: string;
}

/**
 * Wrapper component that shows a top ActivityIndicator during loading/refreshing
 * The indicator appears at the top matching the app's design style
 */
const RefreshableWrapper = ({
  children,
  refreshing = false,
  loading = false,
  indicatorColor = "#AB8BFF",
}: RefreshableWrapperProps) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;

  const isActive = refreshing || loading;

  useEffect(() => {
    if (isActive) {
      // Show indicator
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide indicator
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, opacityAnim, translateYAnim]);

  return (
    <View style={styles.container}>
      {/* Top ActivityIndicator - Simple style matching app design */}
      <Animated.View
        style={[
          styles.indicatorContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <ActivityIndicator size="large" color={indicatorColor} />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  indicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: Platform.OS === "android" ? 1000 : 0,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
  },
});

export default RefreshableWrapper;
