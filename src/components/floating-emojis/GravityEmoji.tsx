import React, { useLayoutEffect } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Emoji } from '../text';

interface GravityEmojiProps {
  distance: number;
  emoji: string;
  left: number;
  size: number;
  top: number;
}

const GravityEmoji = ({
  distance,
  emoji,
  left,
  size,
  top,
}: GravityEmojiProps) => {
  const animation = useSharedValue(0);

  const getRandomNumber = (spread = 180) =>
    Math.random() * (spread - -spread) + -spread;

  const randomSpin = getRandomNumber(1080);
  const randomDistance = Math.random() * 200 + 300;

  const duration = 2000;
  const timeDilation = 1000;

  // 👾 GRAVITY SIMULATION 👾 //
  const g = 9.81;
  const scaledGravity = g * timeDilation * timeDilation;

  // Determine initial trajectory angles
  const xAngle = Math.random() * Math.PI;

  const verticalBias = Math.random();
  let yAngle: number;

  if (verticalBias < 0.9) {
    // 90% odds to move upwards
    yAngle = (5 * Math.PI) / 3 + (verticalBias - 0.9) * ((2 * Math.PI) / 3);
  } else {
    // 10% odds to move downwards
    yAngle = Math.PI / 3 + (verticalBias * 10 - 1) * ((4 * Math.PI) / 3);
  }

  // Determine initial velocities
  const yBoost = 9;
  const v0y =
    (verticalBias < 0.9 ? yBoost : 0.1) *
    randomDistance *
    Math.sin(yAngle) *
    timeDilation;

  const xBoost = 2;
  const v0x = xBoost * randomDistance * Math.cos(xAngle) * timeDilation;

  useLayoutEffect(() => {
    animation.value = withTiming(2, {
      duration,
      easing: Easing.linear,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animation.value, [0, 1], [0, distance]);

    const scale = 0.5;
    const rotate =
      interpolate(progress, [0, distance], [0, randomSpin]) + 'deg';

    const t = animation.value;
    const translateX = (v0x * t) / timeDilation;
    const translateY = (v0y * t + 0.5 * scaledGravity * t * t) / timeDilation;

    return {
      transform: [{ scale }, { translateX }, { translateY }, { rotate }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          left,
          position: 'absolute',
          top: top || size * -0.5,
        },
        animatedStyle,
      ]}
    >
      <Emoji
        name={emoji}
        // @ts-expect-error – JS component
        size={size}
      />
    </Animated.View>
  );
};

const neverRerender = () => true;
export default React.memo(GravityEmoji, neverRerender);
