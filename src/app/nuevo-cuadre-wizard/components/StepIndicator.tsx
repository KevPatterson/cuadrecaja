'use client';
import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Turno' },
  { num: 2, label: 'OCR' },
  { num: 3, label: 'Inventario' },
  { num: 4, label: 'Ingresos' },
  { num: 5, label: 'Arqueo' },
  { num: 6, label: 'Resumen' },
];

interface Props {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-1">
      <div className="flex items-center min-w-max mx-auto px-2">
        {STEPS.map((step, idx) => {
          const done = currentStep > step.num;
          const active = currentStep === step.num;
          return (
            <React.Fragment key={`step-${step.num}`}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={
                    done
                      ? 'step-indicator-done'
                      : active
                      ? 'step-indicator-active' :'step-indicator-pending'
                  }
                >
                  {done ? <Check size={14} /> : <span>{step.num}</span>}
                </div>
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{
                    color: active
                      ? 'hsl(var(--primary-light))'
                      : done
                      ? 'hsl(var(--text-secondary))'
                      : 'hsl(var(--text-muted))',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="h-px flex-1 mx-1 mt-[-16px]"
                  style={{
                    minWidth: '1.5rem',
                    background: done
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--border))',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}