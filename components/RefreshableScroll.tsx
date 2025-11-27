import React from "react";
import { ScrollView, RefreshControl, ScrollViewProps } from "react-native";

type RefreshableScrollProps = ScrollViewProps & {
  onRefresh: () => Promise<void> | void;
  refreshing?: boolean;
  indicatorColor?: string;
  androidColors?: string[];
  progressBackgroundColor?: string;
};

/**
 * ScrollView with pull-to-refresh functionality
 * Note: The native RefreshControl indicator is hidden (transparent)
 * Use RefreshableWrapper to show a custom top indicator
 */
const RefreshableScroll = ({
  children,
  onRefresh,
  refreshing: refreshingProp,
  indicatorColor = "#AB8BFF",
  androidColors,
  progressBackgroundColor = "transparent",
  ...rest
}: RefreshableScrollProps) => {
  const [internalRefreshing, setInternalRefreshing] = React.useState(false);

  const refreshing = refreshingProp ?? internalRefreshing;

  const handleRefresh = React.useCallback(async () => {
    if (refreshingProp === undefined) setInternalRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      // Add small delay to ensure smooth animation
      setTimeout(() => {
        if (refreshingProp === undefined) setInternalRefreshing(false);
      }, 100);
    }
  }, [onRefresh, refreshingProp]);

  return (
    <ScrollView
      alwaysBounceVertical
      bounces
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="transparent" // Hide iOS indicator
          colors={["transparent"]} // Hide Android indicator
          progressBackgroundColor="transparent"
        />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScroll;
