import { useCallback, useMemo } from 'react';
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const VELOCITY_THRESHOLD = 600;
const DIRECTION_LOCK_PX = 12;

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
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);

  const completeWeekChange = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next') {
        onNextWeek();
        return;
      }
      onPreviousWeek();
    },
    [onNextWeek, onPreviousWeek],
  );

  const weekPan = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .simultaneousWithExternalGesture(scrollNativeGesture)
        .onTouchesDown((event) => {
          touchStartX.value = event.allTouches[0]?.x ?? 0;
          touchStartY.value = event.allTouches[0]?.y ?? 0;
        })
        .onTouchesMove((event, state) => {
          if (isAnimating.value) {
            state.fail();
            return;
          }

          const touch = event.allTouches[0];
          if (!touch) {
            return;
          }

          const deltaX = touch.x - touchStartX.value;
          const deltaY = touch.y - touchStartY.value;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (absY > absX && absY > DIRECTION_LOCK_PX) {
            state.fail();
            return;
          }

          if (absX > absY && absX > DIRECTION_LOCK_PX) {
            state.activate();
          }
        })
        .onUpdate((event) => {
          if (!isAnimating.value) {
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
            translateX.value = withTiming(-SCREEN_WIDTH, { duration: 180 }, (finished) => {
              if (!finished) {
                isAnimating.value = false;
                return;
              }
              translateX.value = 0;
              isAnimating.value = false;
              runOnJS(completeWeekChange)('next');
            });
            return;
          }

          if (goPrev) {
            isAnimating.value = true;
            translateX.value = withTiming(SCREEN_WIDTH, { duration: 180 }, (finished) => {
              if (!finished) {
                isAnimating.value = false;
                return;
              }
              translateX.value = 0;
              isAnimating.value = false;
              runOnJS(completeWeekChange)('prev');
            });
            return;
          }

          translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        })
        .onFinalize(() => {
          if (!isAnimating.value) {
            translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
          }
        }),
    [completeWeekChange, isAnimating, scrollNativeGesture, touchStartX, touchStartY, translateX],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={weekPan}>
      <Animated.View style={[styles.container, animatedStyle]} collapsable={false}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
