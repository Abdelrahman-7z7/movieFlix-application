import React from 'react'
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native'

type RefreshableScrollProps = ScrollViewProps & {
  onRefresh: () => Promise<void> | void;
  refreshing?: boolean;
  indicatorColor?: string;
  androidColors?: string[];
  progressBackgroundColor?: string;
}

const RefreshableScroll = ({
  children,
  onRefresh,
  refreshing: refreshingProp,
  indicatorColor = '#fff',
  androidColors,
  progressBackgroundColor = 'transparent',
  ...rest
}: RefreshableScrollProps) => {
  const [internalRefreshing, setInternalRefreshing] = React.useState(false)

  const refreshing = refreshingProp ?? internalRefreshing

  const handleRefresh = React.useCallback(async () => {
    if (refreshingProp === undefined) setInternalRefreshing(true)
    try {
      await onRefresh()
    } finally {
      if (refreshingProp === undefined) setInternalRefreshing(false)
    }
  }, [onRefresh, refreshingProp])

  return (
    <ScrollView
      alwaysBounceVertical
      bounces
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={indicatorColor} // iOS
          colors={androidColors ?? [indicatorColor]} // Android
          progressBackgroundColor={progressBackgroundColor}
        />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  )
}

export default RefreshableScroll


