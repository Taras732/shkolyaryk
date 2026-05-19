import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { AppText } from '../../components/AppText';
import { NumberKeypad } from '../../components/game/NumberKeypad';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';

export type ItemKey =
  | 'apple'
  | 'star'
  | 'fish'
  | 'flower'
  | 'car'
  | 'bee'
  | 'leaf'
  | 'strawberry'
  | 'snowflake'
  | 'mitten'
  | 'cloud'
  | 'moon'
  | 'butterfly'
  | 'mushroom'
  | 'duck';

export interface CountPayload {
  itemKey: ItemKey;
  correctCount: number;
  positions: { xFrac: number; yFrac: number }[];
}

export type CountAnswer = number;

const SPRITE_SIZE = 40;
const MAX_DIGITS = 2;

const ITEM_EMOJI: Record<ItemKey, string> = {
  apple: '🍎',
  star: '⭐',
  fish: '🐠',
  flower: '🌸',
  car: '🚗',
  bee: '🐝',
  leaf: '🍃',
  strawberry: '🍓',
  snowflake: '❄️',
  mitten: '🧤',
  cloud: '☁️',
  moon: '🌙',
  butterfly: '🦋',
  mushroom: '🍄',
  duck: '🦆',
};

export function Renderer({ task, onAnswer, disabled }: RendererProps<CountAnswer>) {
  const [input, setInput] = useState('');
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const payload = task.payload as CountPayload;
  const emoji = ITEM_EMOJI[payload.itemKey];

  useEffect(() => {
    setInput('');
  }, [task.id]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }, []);

  const handleDigit = (d: string) => {
    if (disabled) return;
    if (input.length >= MAX_DIGITS) return;
    if (input.length === 0 && d === '0') return;
    setInput(input + d);
  };

  const handleDelete = () => {
    if (disabled) return;
    setInput(input.slice(0, -1));
  };

  const handleOk = () => {
    if (disabled || input.length === 0) return;
    const n = parseInt(input, 10);
    setInput('');
    onAnswer(n);
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="h2" style={styles.question}>
        {t('game.countObjects.question')}
      </AppText>

      <View style={styles.field} onLayout={onLayout}>
        {size.w > 0
          ? payload.positions.map((p, i) => {
              const left = p.xFrac * size.w - SPRITE_SIZE / 2;
              const top = p.yFrac * size.h - SPRITE_SIZE / 2;
              return (
                <AppText
                  key={i}
                  style={[styles.sprite, { left, top }]}
                  accessibilityLabel={emoji}
                >
                  {emoji}
                </AppText>
              );
            })
          : null}
      </View>

      <NumberKeypad
        value={input}
        onDigit={handleDigit}
        onDelete={handleDelete}
        onOk={handleOk}
        okDisabled={input.length === 0}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: spacing.sm,
  },
  question: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontFamily: fontFamily.extraBold,
  },
  field: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    minHeight: 200,
  },
  sprite: {
    position: 'absolute',
    fontSize: SPRITE_SIZE,
    lineHeight: SPRITE_SIZE,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    textAlign: 'center',
  },
});
