import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Check } from 'lucide-react-native';

export interface StepIndicatorProps {
  currentStep: number; // 1 to 5
  steps?: string[];
}

const DEFAULT_STEPS = ['Hub', 'Floor', 'Duration', 'Vehicle', 'Review'];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps = DEFAULT_STEPS,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((stepName, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepName}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted ? styles.connectorCompleted : null,
                  ]}
                />
              )}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCurrent && styles.circleCurrent,
                    isCompleted && styles.circleCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={14} color="#171717" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        isCurrent && styles.circleTextCurrent,
                      ]}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {stepName}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 52,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.round,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleCurrent: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  circleCompleted: {
    backgroundColor: Colors.secondaryYellow,
    borderColor: Colors.primaryYellow,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  circleTextCurrent: {
    color: '#171717',
    fontWeight: '800',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  connectorCompleted: {
    backgroundColor: Colors.primaryYellow,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
});
