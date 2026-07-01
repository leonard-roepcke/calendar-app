import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import type { ReactNode } from 'react';

const CENTER_PAGE = 1;

interface WeekPagerProps {
  pageKey: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  renderPage: (weekOffset: -1 | 0 | 1) => ReactNode;
}

export function WeekPager({
  pageKey,
  onPreviousWeek,
  onNextWeek,
  renderPage,
}: WeekPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const isResettingRef = useRef(false);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      if (isResettingRef.current) {
        return;
      }

      const position = event.nativeEvent.position;
      if (position === 0) {
        onPreviousWeek();
      } else if (position === 2) {
        onNextWeek();
      } else {
        return;
      }

      isResettingRef.current = true;
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(CENTER_PAGE);
        isResettingRef.current = false;
      });
    },
    [onNextWeek, onPreviousWeek],
  );

  return (
    <PagerView
      key={pageKey}
      ref={pagerRef}
      style={styles.pager}
      initialPage={CENTER_PAGE}
      onPageSelected={handlePageSelected}
      overdrag
      offscreenPageLimit={1}
    >
      <View key="prev" style={styles.page} collapsable={false}>
        {renderPage(-1)}
      </View>
      <View key="current" style={styles.page} collapsable={false}>
        {renderPage(0)}
      </View>
      <View key="next" style={styles.page} collapsable={false}>
        {renderPage(1)}
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
