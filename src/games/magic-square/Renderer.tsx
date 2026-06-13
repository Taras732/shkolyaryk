import { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily, shadows } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';
import { MAGIC_SUM, isValidMagicSquare, type MagicCell } from './solver';

export interface MagicPayload {
  puzzle: MagicCell[][];
  solution: number[][];
}

export type MagicAnswer = number[][];

const CELL_SIZE = 72;

export function Renderer({ task, onAnswer, disabled }: RendererProps<MagicAnswer>) {
  const payload = task.payload as MagicPayload;
  const [grid, setGrid] = useState<MagicCell[][]>(payload.puzzle.map((r) => [...r]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setGrid(payload.puzzle.map((r) => [...r]));
    setSelected(null);
    setShowErrors(false);
    setSubmitted(false);
  }, [task.id]);

  const isPreFilled = (r: number, c: number) => payload.puzzle[r][c] !== null;

  const selectCell = (r: number, c: number) => {
    if (disabled || submitted || isPreFilled(r, c)) return;
    setSelected({ r, c });
    setShowErrors(false);
  };

  const enterNumber = (n: number) => {
    if (disabled || submitted || !selected) return;
    const { r, c } = selected;
    if (isPreFilled(r, c)) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = n;
    setGrid(newGrid);
    setShowErrors(false);
  };

  const clearCell = () => {
    if (disabled || submitted || !selected) return;
    const { r, c } = selected;
    if (isPreFilled(r, c)) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = null;
    setGrid(newGrid);
    setShowErrors(false);
  };

  const allFilled = grid.every((row) => row.every((v) => v !== null));

  const isWrong = (r: number, c: number): boolean => {
    if (!showErrors) return false;
    const v = grid[r][c];
    if (v === null) return false;
    // Mark wrong only on true rule violations:
    // (a) a duplicate value, or (b) belonging to a fully-filled row/column/
    // diagonal whose sum ≠ MAGIC_SUM. Not by mismatch with payload.solution.
    let dupes = 0;
    for (let rr = 0; rr < 3; rr++) {
      for (let cc = 0; cc < 3; cc++) {
        if (grid[rr][cc] === v) dupes++;
      }
    }
    if (dupes > 1) return true;

    const lineSum = (cells: MagicCell[]): boolean => {
      if (cells.some((x) => x === null)) return false; // incomplete line — don't flag yet
      const sum = cells.reduce<number>((acc, x) => acc + (x as number), 0);
      return sum !== MAGIC_SUM;
    };

    if (lineSum([grid[r][0], grid[r][1], grid[r][2]])) return true;
    if (lineSum([grid[0][c], grid[1][c], grid[2][c]])) return true;
    if (r === c && lineSum([grid[0][0], grid[1][1], grid[2][2]])) return true;
    if (r + c === 2 && lineSum([grid[0][2], grid[1][1], grid[2][0]])) return true;
    return false;
  };

  const handleCheck = () => {
    if (disabled || submitted || !allFilled) return;
    // Accept ANY valid magic square that preserves givens, not just payload.solution.
    if (isValidMagicSquare(grid, payload.puzzle)) {
      setSubmitted(true);
      onAnswer(grid as number[][]);
    } else {
      setShowErrors(true);
    }
  };

  const handleGiveUp = () => {
    if (disabled || submitted) return;
    setSubmitted(true);
    onAnswer(grid.map((row) => row.map((v) => v ?? 0)));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <AppText style={styles.rulesHint}>
        {t('game.magicSquare.rulesHint', { sum: MAGIC_SUM })}
      </AppText>

      <View style={styles.board}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((v, c) => {
              const preFilled = isPreFilled(r, c);
              const isSel = selected?.r === r && selected?.c === c;
              const wrong = isWrong(r, c);
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.cell,
                    preFilled && styles.cellPreFilled,
                    isSel && styles.cellSelected,
                    wrong && styles.cellWrong,
                  ]}
                  onPress={() => selectCell(r, c)}
                  disabled={preFilled || disabled || submitted}
                >
                  <AppText
                    style={[
                      styles.cellText,
                      preFilled ? styles.cellTextPre : styles.cellTextUser,
                      wrong && styles.cellTextWrong,
                    ]}
                  >
                    {v ?? ''}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Pressable
            key={n}
            style={[styles.numBtn, (!selected || disabled || submitted) && styles.disabled]}
            onPress={() => enterNumber(n)}
            disabled={!selected || disabled || submitted}
          >
            <AppText style={styles.numBtnText}>{n}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionBtn, styles.actionGhost, (!selected || submitted) && styles.disabled]}
          onPress={clearCell}
          disabled={!selected || disabled || submitted}
        >
          <AppText style={styles.actionText}>⌫ {t('game.magicSquare.erase')}</AppText>
        </Pressable>
        <Pressable
          style={[
            styles.actionBtn,
            styles.actionPrimary,
            (!allFilled || submitted) && styles.disabled,
          ]}
          onPress={handleCheck}
          disabled={!allFilled || disabled || submitted}
        >
          <AppText style={[styles.actionText, { color: '#fff' }]}>
            {t('game.magicSquare.check')}
          </AppText>
        </Pressable>
      </View>

      <Pressable
        style={[styles.giveUpBtn, submitted && styles.disabled]}
        onPress={handleGiveUp}
        disabled={disabled || submitted}
      >
        <AppText style={styles.giveUpText}>{t('game.magicSquare.giveUp')}</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  rulesHint: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  board: {
    borderWidth: 3,
    borderColor: colors.text,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPreFilled: {
    backgroundColor: colors.surfaceSoft,
  },
  cellSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cellWrong: {
    backgroundColor: '#FEE2E2',
  },
  cellText: {
    fontSize: 36,
    fontFamily: fontFamily.extraBold,
  },
  cellTextPre: {
    color: colors.text,
  },
  cellTextUser: {
    color: colors.primary,
  },
  cellTextWrong: {
    color: '#DC2626',
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  numBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  numBtnText: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhost: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 2,
    borderColor: colors.border,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  giveUpBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  giveUpText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.5,
  },
});
