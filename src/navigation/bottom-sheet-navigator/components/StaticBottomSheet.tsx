import React, { useMemo } from 'react';
import { BottomSheet } from './BottomSheet';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  snapPoints?: Array<string | number>;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWindowOverlay?: boolean;
};

export function StaticBottomSheet({
  snapPoints = ['100%'],
  scrollable = false,
  fullWindowOverlay,
  style,
  children,
}: React.PropsWithChildren<Props>) {
  const isFullscreen = snapPoints.includes('100%');
  const Wrapper = useMemo(
    () => (scrollable ? BottomSheetScrollView : BottomSheetView),
    [scrollable]
  );

  return (
    <BottomSheet
      snapPoints={snapPoints}
      enableOverDrag={!isFullscreen}
      fullWindowOverlay={fullWindowOverlay}
    >
      {({ containerStyle }) => (
        <Wrapper style={StyleSheet.flatten([containerStyle, style])}>
          {children}
        </Wrapper>
      )}
    </BottomSheet>
  );
}
