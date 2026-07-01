import { useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.22;
const VELOCITY_THRESHOLD = 650;

interface WeekSwipeContainerProps {
  children: ReactNode;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  scrollNativeGesture: ReturnType<typeof Gesture.Native>;
}

export function WeekSwipeContainer({
  children,
  onPreviousWeek,
  onNextWeek,
  scrollNativeGesture,
}: WeekSwipeContainerProps) {
  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const weekPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-12, 12])
        .simultaneousWithExternalGesture(scrollNativeGesture)
        .onUpdate((event) => {
          if (isAnimating.value) {
            return;
          }
          if (Math.abs(event.translationX) > Math.abs(event.translationY) * 1.2) {
            translateX.value = event.translationX;
          }
        })
        .onEnd((event) => {
          if (isAnimating.value) {
            return;
          }

          const goNext =
            event.translationX < -SWIPE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD;
          const goPrev =
            event.translationX > SWIPE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD;

          if (goNext) {
            isAnimating.value = true;
            translateX.value = withTiming(
              -SCREEN_WIDTH,
              { duration: 220 },
              (finished) => {
                if (finished) {
                  runOnJS(onNextWeek)();
                  translateX.value = SCREEN_WIDTH;
                  translateX.value = withTiming(0, { duration: 220 }, () => {
                    isAnimating.value = false;
                  });
                }
              },
            );
            return;
          }

          if (goPrev) {
            isAnimating.value = true;
            translateX.value = withTiming(
              SCREEN_WIDTH,
              { duration: 220 },
              (finished) => {
                if (finished) {
                  runOnJS(onPreviousWeek)();
                  translateX.value = -SCREEN_WIDTH;
                  translateX.value = withTiming(0, { duration: 220 }, () => {
                    isAnimating.value = false;
                  });
                }
              },
            );
            return;
          }

          translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        })
        .onFinalize(() => {
          if (!isAnimating.value && Math.abs(translateX.value) < 1) {
            translateX.value = withSpring(0);
          }
        }),
    [isAnimating, onNextWeek, onPreviousWeek, scrollNativeGesture, translateX],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={weekPan}>
      <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
