import React from 'react';
import useExperimentalFlag, {
  OP_REWARDS,
  PROFILES,
  HARDWARE_WALLETS,
  NFT_OFFERS,
  MINT_DOT_FUN,
} from '@rainbow-me/config/experimentalHooks';
import Lists from './ListsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountSettings, useWallets } from '@/hooks';
import { ENSCreateProfileCard } from '@/components/cards/ENSCreateProfileCard';
import { ENSSearchCard } from '@/components/cards/ENSSearchCard';
import { DPICard } from '@/components/cards/DPICard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import {
  avoidScamsCard,
  backupsCard,
  cryptoAndWalletsCard,
} from '@/components/cards/utils/constants';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import config from '@/model/config';
import walletTypes from '@/helpers/walletTypes';
import { NFTOffersCard } from '@/components/cards/NFTOffersCard';
import { MintDotFunCard } from '@/components/cards/MintDotFunCard';
import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';

export default function DiscoverHome() {
  const { network } = useAccountSettings();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = config.profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  const mintDotFunEnabled = useExperimentalFlag(MINT_DOT_FUN);
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = config.op_rewards_enabled;
  const testNetwork = isTestnetNetwork(network);
  const isProfilesEnabled =
    profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  const { wallets } = useWallets();

  const hasHardwareWallets =
    Object.keys(wallets || {}).filter(
      key => wallets[key].type === walletTypes.bluetooth
    ).length > 0;

  return (
    <Inset top="10px" bottom={{ custom: 150 }}>
      <Inset horizontal="20px">
        {!testNetwork ? (
          <Stack>
            <Inline space="20px">
              <GasCard />
              {isProfilesEnabled && <ENSSearchCard />}
            </Inline>
            {mintDotFunEnabled && (
              <Stack>
                <FeaturedMintCard />
                <MintDotFunCard />
              </Stack>
            )}
            {nftOffersEnabled && <NFTOffersCard />}
            {/* We have both flags here to be able to override the remote flag and show the card anyway in Dev*/}
            {(opRewardsRemoteFlag || opRewardsLocalFlag) && <OpRewardsCard />}
            {hardwareWalletsEnabled && !hasHardwareWallets && <LedgerCard />}
            {isProfilesEnabled && <ENSCreateProfileCard />}
            <Inline space="20px">
              <LearnCard cardDetails={backupsCard} type="square" />
              <LearnCard cardDetails={avoidScamsCard} type="square" />
            </Inline>
            <DPICard />
          </Stack>
        ) : (
          <Stack>
            <Inline space="20px">
              <GasCard />
              <LearnCard cardDetails={cryptoAndWalletsCard} type="square" />
            </Inline>
            <DPICard />
          </Stack>
        )}
      </Inset>
      <Lists />
    </Inset>
  );
}
