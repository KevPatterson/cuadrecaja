'use client';
import React from 'react';

const STEPS = [
  { num: 1, label: 'TURNO' },
  { num: 2, label: 'OCR' },
  { num: 3, label: 'INV' },
  { num: 4, label: 'ING' },
  { num: 5, label: 'ARQ' },
  { num: 6, label: 'RES' },
];

interface Props {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-1">
      <div className="ledger-step-track mx-auto px-2">
        {STEPS.map((step, idx) => {
          const done = currentStep > step.num;
          const active = currentStep === step.num;
          const stateClass = done ? 'done' : active ? 'active' : 'future';
          return (
            <React.Fragment key={`step-${step.num}`}>
              <div className="ledger-step-item">
                <div className={`ledger-step-number ${stateClass}`}>
                  {String(step.num).padStart(2, '0')}
                </div>
                <span className="ledger-step-label" style={{ color: done || active ? 'var(--ink)' : 'var(--ink-muted)' }}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <span className="ledger-step-divider">—</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}