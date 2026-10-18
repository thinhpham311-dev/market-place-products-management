import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import rootReducer from '@/store/rootReducer';
import { useHydrated } from '@/store/StoreProvider';

const ssrInitialState = rootReducer()(undefined, {
  type: '@@INIT',
}) as unknown as RootState;

const useRawAppSelector = useSelector.withTypes<RootState>();

// Typed hooks — always use these instead of the plain react-redux hooks
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export function useAppSelector<TSelected>(
  selector: (state: RootState) => TSelected
): TSelected {
  const isHydrated = useHydrated();
  const liveValue = useRawAppSelector(selector);
  if (!isHydrated) {
    return selector(ssrInitialState);
  }
  return liveValue;
}
