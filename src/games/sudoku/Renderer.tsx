import { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily, shadows } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';
import { hasConflict, isValidSolution, type SudokuCell } from './solver';

export interface SudokuPayload {
  puzzle: SudokuCell[][];
  solution: number[][];
}

export type SudokuAnswer = number[][];

const CELL_SIZE = 34;

export function Renderer({ task, onAnswer, disabled }: RendererProps<SudokuAnswer>) {
  const payload = task.payload as SudokuPayload;
  const [grid, setGrid] = useState<SudokuCell[][]>(payload.puzzle.map((r) => [...r]));
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
    if (disabled || submitted) return;
    if (isPreFilled(r, c)) return;
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
    // Highlight only true rule violations: a duplicate in row/column/block.
    return hasConflict(grid, r, c);
  };

  const handleCheck = () => {
    if (disabled || submitted || !allFilled) return;
    // Accept ANY rule-valid completion that preserves givens, not just payload.solution.
    if (isValidSolution(grid, payload.puzzle)) {
      setSubmitted(true);
      onAnswer(grid as number[][]);
    } else {
      setShowErrors(true);
    }
  };

  const handleGiveUp = () => {
    if (disabled || submitted) return;
    setSubmitted(true);
    // Submit current grid (likely wrong) — validator will mark wrong
    onAnswer(grid.map((row) => row.map((v) => v ?? 0)));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.board}>
        {grid.map((row, r) => (
          <View key={r} style={[styles.row, (r === 2 || r === 5) && styles.rowThickBottom]}>
            {row.map((v, c) => {
              const preFilled = isPreFilled(r, c);
              const isSel = selected?.r === r && selected?.c === c;
              const wrong = isWrong(r, c);
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.cell,
                    (c === 2 || c === 5) && styles.cellThickRight,
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
          <AppText style={styles.actionText}>⌫ {t('game.sudoku.erase')}</AppText>
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
          <AppText style={[styles.actionText, { color: '#fff' }]}>{t('game.sudoku.check')}</AppText>
        </Pressable>
      </View>

      <Pressable
        style={[styles.giveUpBtn, submitted && styles.disabled]}
        onPress={handleGiveUp}
        disabled={disabled || submitted}
      >
        <AppText style={styles.giveUpText}>{t('game.sudoku.giveUp')}</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },
  board: {
    borderWidth: 3,
    borderColor: colors.text,
    borderRadius: 4,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
  },
  rowThickBottom: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellThickRight: {
    borderRightWidth: 2,
    borderRightColor: colors.text,
  },
  cellPreFilled: {
    backgroundColor: colors.surfaceSoft,
  },
  cellSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cellWrong: {
    backgroundColor: '#FEE2E2',
  },
  cellText: {
    fontSize: 18,
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
    gap: 4,
    justifyContent: 'center',
  },
  numBtn: {
    width: 40,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  numBtnText: {
    fontSize: 22,
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
