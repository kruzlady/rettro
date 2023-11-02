import lang from 'i18n-js';
import React from 'react';
import { Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  Easing,
  withDelay,
  interpolate,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  FloatingEmojis,
  FloatingEmojisTapper,
} from '@/components/floating-emojis';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import {
  Bleed,
  Box,
  Cover,
  DebugLayout,
  Inline,
  Separator,
  Stack,
  Text,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import {
  useAccountAccentColor,
  useAccountProfile,
  useClipboard,
  useDimensions,
} from '@/hooks';
import { useTheme } from '@/theme';
import { POINTS, useExperimentalFlag } from '@/config';
import config from '@/model/config';
import { ScrollView } from 'react-native-gesture-handler';
import MaskedView from '@react-native-masked-view/masked-view';
import BlurredRainbow from '@/assets/blurredRainbow.png';
import Planet from '@/assets/planet.png';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { IS_IOS, IS_TEST } from '@/env';
import { haptics, safeAreaInsetValues } from '@/utils';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useRecoilState } from 'recoil';
import { Toast, ToastPositionContainer } from '@/components/toasts';

const fallConfig = {
  duration: 2000,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const jumpConfig = {
  duration: 500,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const flyUpConfig = {
  duration: 2500,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1.0),
};

const infoCircleColor = 'rgba(245, 248, 255, 0.25)';

const LeaderboardRow = () => {
  const rank: number = 1;
  let gradient;
  let icon;
  switch (rank) {
    case 1:
      gradient = ['#FFE456', '#CF9500'];
      icon = '🥇';
      break;
    case 2:
      gradient = ['#FBFCFE', '#B3BCC7'];
      icon = '🥈';
      break;
    case 3:
      gradient = ['#DE8F38', '#AE5F25'];
      icon = '🥉';
      break;
    case 4:
      icon = '􀁀';
      break;
    case 5:
      icon = '􀁂';
      break;
    case 6:
      icon = '􀁄';
      break;
    case 7:
      icon = '􀁆';
      break;
    case 8:
      icon = '􀁈';
      break;
    case 9:
      icon = '􀁊';
      break;
    case 10:
      icon = '􀓵';
      break;
    default:
      icon = '􀁜';
      break;
  }

  return (
    <Box
      paddingVertical="10px"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Inline space="10px" alignVertical="center">
        <Box
          style={{ width: 36, height: 36 }}
          borderRadius={18}
          background="surfaceSecondaryElevated"
          shadow="12px"
        />
        <Stack space="8px">
          <Text color="label" weight="bold" size="15pt">
            0x4ce…a8a8
          </Text>
          <Inline space="2px" alignVertical="center">
            <Text color="labelQuaternary" size="11pt" weight="bold">
              􀙬
            </Text>
            <Text color="labelQuaternary" size="13pt" weight="semibold">
              40 days
            </Text>
          </Inline>
        </Stack>
      </Inline>
      <Inline space="8px" alignVertical="center">
        {rank <= 3 && gradient ? (
          <MaskedView
            maskElement={
              <Text align="right" weight="bold" color="label" size="15pt">
                102,687
              </Text>
            }
          >
            <Bleed vertical={{ custom: 5 }}>
              <LinearGradient
                style={{ width: 100, height: 20 }}
                colors={gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              />
            </Bleed>
          </MaskedView>
        ) : (
          <Text align="right" weight="bold" color="labelTertiary" size="15pt">
            102,687
          </Text>
        )}
        <Text
          align="center"
          weight="semibold"
          color="labelTertiary"
          size="15pt"
          containsEmoji={rank <= 3}
        >
          {icon}
        </Text>
      </Inline>
    </Box>
  );
};

const InfoCard = ({
  onPress,
  title,
  subtitle,
  mainText,
  icon,
  accentColor,
}: {
  onPress: () => void;
  title: string;
  subtitle: string;
  mainText: string;
  icon: string;
  accentColor: string;
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Box
      padding="20px"
      background="surfaceSecondaryElevated"
      shadow="12px"
      height={{ custom: 98 }}
      borderRadius={18}
    >
      <Stack space="12px">
        <Inline space="4px" alignVertical="center">
          <Text color="labelSecondary" weight="bold" size="15pt">
            {title}
          </Text>
          <Text color={{ custom: infoCircleColor }} weight="heavy" size="13pt">
            􀅵
          </Text>
        </Inline>
        <Text color="label" weight="heavy" size="22pt">
          {mainText}
        </Text>
        <Inline space="4px">
          <Text
            align="center"
            weight="heavy"
            size="12pt"
            color={{ custom: accentColor }}
          >
            {icon}
          </Text>
          <Text weight="heavy" size="13pt" color={{ custom: accentColor }}>
            {subtitle}
          </Text>
        </Inline>
      </Stack>
    </Box>
  </ButtonPressAnimation>
);

export default function PointsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const {
    accountAddress,
    accountImage,
    accountColor,
    accountSymbol,
  } = useAccountProfile();
  const pointsFullyEnabled =
    useExperimentalFlag(POINTS) || config.points_fully_enabled;
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();

  const iconState = useSharedValue(1);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0.75, 0.7, 0.65, 0.55, 0.75, 0.7, 0.65, 0.55, 0.75]
    );
    const rotate = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-12, -4, -12, -12, -372, -380, -372, -372, -12]
    );
    const translateX = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0, 4, 0, 0, 0, -4, 0, 0, 0]
    );
    const translateY = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-20, -5, 10, 14, -20, -5, 10, 14, -20]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  React.useEffect(() => {
    if (IS_TEST) return;

    progress.value = 0;
    progress.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, fallConfig),
          withTiming(2, fallConfig),
          withTiming(3, jumpConfig),
          withTiming(4, flyUpConfig),
          withTiming(5, fallConfig),
          withTiming(6, fallConfig),
          withTiming(7, jumpConfig),
          withTiming(8, flyUpConfig)
        ),
        -1,
        false
      )
    );
  }, [progress]);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const labelSecondary = useForegroundColor('labelSecondary');
  const pink = useForegroundColor('pink');
  const yellow = useForegroundColor('yellow');

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onPressCopy = React.useCallback(
    (onNewEmoji: () => void) => {
      if (!isToastActive) {
        setToastActive(true);
        setTimeout(() => {
          setToastActive(false);
        }, 2000);
      }
      haptics.notificationSuccess();
      onNewEmoji();
      setClipboard(accountAddress);
    },
    [accountAddress, isToastActive, setClipboard, setToastActive]
  );

  return (
    <Box as={Page} flex={1} testID="points-screen" width="full">
      <Navbar
        hasStatusBarInset
        leftComponent={
          pointsFullyEnabled && (
            <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
              {accountImage ? (
                <ImageAvatar
                  image={accountImage}
                  marginRight={10}
                  size="header"
                />
              ) : (
                <ContactAvatar
                  color={accountColor}
                  marginRight={10}
                  size="small"
                  value={accountSymbol}
                />
              )}
            </ButtonPressAnimation>
          )
        }
        title={lang.t('account.tab_points')}
      />
      {pointsFullyEnabled ? (
        <ScrollView
          style={{
            paddingHorizontal: 20,
          }}
          scrollIndicatorInsets={{
            bottom: TAB_BAR_HEIGHT - safeAreaInsetValues.bottom,
          }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 32 }}
        >
          <Stack space="32px">
            <Box flexDirection="row" alignItems="center" paddingTop="16px">
              {/* <Box
                width={{ custom: 36 }}
                height={{ custom: 36 }}
                background="blue"
              /> */}

              <MaskedView
                style={{
                  alignItems: 'center',
                  height: 31,
                  maxWidth: deviceWidth - 60 - 20 - 20,
                }}
                maskElement={
                  <Text color="label" size="44pt" weight="heavy">
                    10,428
                  </Text>
                }
              >
                <Image
                  source={BlurredRainbow}
                  resizeMode="stretch"
                  style={{
                    width: 300,
                    height: 300,
                    left: -100,
                    top: -180,
                  }}
                />
              </MaskedView>
              <Bleed vertical={{ custom: 2.5 }}>
                <Image source={Planet} style={{ width: 60, height: 36 }} />
              </Bleed>
              {/* <Box
              width={{ custom: 36 }}
              height={{ custom: 36 }}
              background="blue"
            /> */}
            </Box>
            <Bleed space="20px">
              <ScrollView
                horizontal
                contentContainerStyle={{ gap: 12, padding: 20 }}
                showsHorizontalScrollIndicator={false}
              >
                <InfoCard
                  onPress={() => {}}
                  title="Next Reward"
                  mainText="20h 19m"
                  icon="􀉉"
                  subtitle="12pm Monday"
                  accentColor={labelSecondary}
                />
                <InfoCard
                  onPress={() => {}}
                  title="Streak"
                  mainText="36 days"
                  icon="􀙬"
                  subtitle="Longest yet"
                  accentColor={pink}
                />
                <InfoCard
                  onPress={() => {}}
                  title="Referrals"
                  mainText="12"
                  icon="􀇯"
                  subtitle="8,200"
                  accentColor={yellow}
                />
              </ScrollView>
            </Bleed>
            <Stack space={{ custom: 14 }}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <ButtonPressAnimation>
                  <Inline space="4px" alignVertical="center">
                    <Text weight="bold" color="labelTertiary" size="15pt">
                      Referral Link
                    </Text>
                    <Text
                      weight="heavy"
                      color={{ custom: infoCircleColor }}
                      size="13pt"
                    >
                      􀅵
                    </Text>
                  </Inline>
                </ButtonPressAnimation>
                <ButtonPressAnimation>
                  <MaskedView
                    style={{
                      justifyContent: 'flex-end',
                      alignItems: 'flex-end',
                    }}
                    maskElement={
                      <Box
                        alignItems="center"
                        flexDirection="row"
                        style={{ gap: 4 }}
                        justifyContent="flex-end"
                      >
                        <Text
                          align="right"
                          weight="bold"
                          color="label"
                          size="13pt"
                        >
                          􀈂
                        </Text>
                        <Text
                          align="right"
                          weight="heavy"
                          color="label"
                          size="15pt"
                        >
                          Share
                        </Text>
                      </Box>
                    }
                  >
                    <Bleed vertical={{ custom: 5 }}>
                      <LinearGradient
                        style={{
                          width: 65,
                          height: 20,
                        }}
                        colors={['#00E7F3', '#57EA5F']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                      />
                    </Bleed>
                  </MaskedView>
                </ButtonPressAnimation>
              </Box>
              {/* @ts-ignore */}
              <FloatingEmojis
                distance={250}
                duration={500}
                fadeOut={false}
                scaleTo={0}
                size={50}
                wiggleFactor={0}
              >
                {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                  <ButtonPressAnimation onPress={() => onPressCopy(onNewEmoji)}>
                    <Box
                      background="surfaceSecondaryElevated"
                      paddingVertical="12px"
                      paddingHorizontal="16px"
                      shadow="12px"
                      borderRadius={18}
                      alignItems="center"
                      flexDirection="row"
                      style={{ gap: 6, height: 48 }}
                    >
                      <Text color="labelTertiary" size="15pt" weight="bold">
                        􀉣
                      </Text>
                      <Box paddingRight="20px">
                        <Text
                          color="labelTertiary"
                          size="17pt"
                          weight="semibold"
                          numberOfLines={1}
                        >
                          rainbow.me/points?ref=0x2e6786983232jkl
                        </Text>
                      </Box>
                    </Box>
                  </ButtonPressAnimation>
                )}
              </FloatingEmojis>
            </Stack>
            <Separator color="separatorTertiary" thickness={1} />
            <Stack space="16px">
              <Text color="label" size="20pt" weight="heavy">
                Leaderboard
              </Text>
              <View
                style={
                  IS_IOS
                    ? {
                        shadowColor: globalColors.grey100,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.02,
                        shadowRadius: 3,
                      }
                    : {}
                }
              >
                <View
                  style={
                    IS_IOS
                      ? {
                          shadowColor: globalColors.grey100,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.16,
                          shadowRadius: 6,
                        }
                      : {
                          shadowColor: globalColors.grey100,
                          elevation: 8,
                          opacity: 1,
                        }
                  }
                >
                  <LinearGradient
                    style={{ padding: 1.5, borderRadius: 18 }}
                    colors={[
                      '#31BCC4',
                      '#57EA5F',
                      '#F0D83F',
                      '#DF5337',
                      '#B756A7',
                    ]}
                    useAngle={true}
                    angle={-15}
                    angleCenter={{ x: 0.5, y: 0.5 }}
                  >
                    <Box
                      background="surfaceSecondaryElevated"
                      width="full"
                      height={{ custom: 48 }}
                      borderRadius={18}
                      flexDirection="row"
                      paddingHorizontal="20px"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text color="label" size="17pt" weight="heavy">
                        skillet.eth
                      </Text>
                      <Text color="label" size="17pt" weight="heavy">
                        #20
                      </Text>
                    </Box>
                  </LinearGradient>
                </View>
              </View>
              <Box
                background="surfaceSecondaryElevated"
                borderRadius={18}
                paddingHorizontal="16px"
              >
                <Stack
                  separator={
                    <Separator color="separatorTertiary" thickness={1} />
                  }
                >
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                  <LeaderboardRow />
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </ScrollView>
      ) : (
        <>
          <Box
            alignItems="center"
            as={Page}
            flex={1}
            height="full"
            justifyContent="center"
          >
            <Box paddingBottom="104px" width="full">
              <Stack alignHorizontal="center" space="28px">
                <Box
                  alignItems="center"
                  as={Animated.View}
                  justifyContent="center"
                  style={[{ height: 28, width: 28 }, animatedStyle]}
                >
                  <TabBarIcon
                    accentColor={accountColor}
                    hideShadow
                    icon="tabPoints"
                    index={1}
                    reanimatedPosition={iconState}
                    size={56}
                    tintBackdrop={colors.white}
                    tintOpacity={isDarkMode ? 0.25 : 0.1}
                  />
                </Box>
                <Stack alignHorizontal="center" space="20px">
                  <Text
                    align="center"
                    color="labelTertiary"
                    size="26pt"
                    weight="semibold"
                  >
                    {lang.t('points.coming_soon_title')}
                  </Text>
                  <Text
                    align="center"
                    color="labelQuaternary"
                    size="15pt"
                    weight="medium"
                  >
                    {lang.t('points.coming_soon_description')}
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </Box>
          <Box
            as={FloatingEmojisTapper}
            distance={500}
            duration={4000}
            emojis={[
              'rainbow',
              'rainbow',
              'rainbow',
              'slot_machine',
              'slot_machine',
            ]}
            gravityEnabled
            position="absolute"
            range={[0, 0]}
            size={80}
            wiggleFactor={0}
            yOffset={-66}
          >
            <Box
              position="absolute"
              style={{
                height: deviceHeight,
                width: deviceWidth,
              }}
            />
          </Box>
        </>
      )}
      <ToastPositionContainer>
        <Toast isVisible={isToastActive} text="􀁣 Link Copied" />
      </ToastPositionContainer>
    </Box>
  );
}
