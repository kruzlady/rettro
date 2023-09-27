import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ChartExpandedState,
  CustomGasState,
  SwapDetailsState,
  SwapSettingsState,
  TokenIndexExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useAsset, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';

const ScreenTypes = {
  custom_gas: CustomGasState, // To be done as a part of Swap
  swap_details: SwapDetailsState, // Migrated
  swap_settings: SwapSettingsState, // To be done as part of Swap
  token: ChartExpandedState, // Migrated
  token_index: TokenIndexExpandedState, // Migrated
  unique_token: UniqueTokenExpandedState, // Migrated
};

const Container = styled(Centered).attrs({
  alignItems: 'flex-end',
  bottom: 0,
  direction: 'column',
  flex: 1,
  justifyContent: 'flex-end',
})(({ deviceHeight, height }) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

export default function ExpandedAssetSheet(props) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { params } = useRoute();

  // We want to revalidate (ie. refresh OpenSea metadata) collectibles
  // to ensure the user can get the latest metadata of their collectible.
  const selectedAsset = useAsset(params.asset);

  const shouldRenderContainer =
    params.type === 'custom_gas' || params.type === 'swap_settings';

  const Wrapper = shouldRenderContainer ? Container : React.Fragment;

  return (
    <Wrapper
      deviceHeight={deviceHeight}
      height={params.longFormHeight}
      insets={insets}
    >
      {ios && shouldRenderContainer && <TouchableBackdrop onPress={goBack} />}

      {createElement(ScreenTypes[params.type], {
        ...params,
        ...props,
        asset: {
          ...params.asset,
          ...selectedAsset,
        },
      })}
    </Wrapper>
  );
}
