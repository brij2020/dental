// src/features/consultation/components/ProgressBar.tsx

import React from 'react';

const STEPS = [
  "Clinical Examination",
  "Procedure",
  "Post Procedure",
  "Prescription",
  "Billing",
  "Schedule follow up / Refer",
];

// 1. Update the props type to accept the new function
type ProgressBarProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
  getStepState?: (step: number) => 'active' | 'complete' | 'available' | 'readonly' | 'locked';
};

export default function ProgressBar({ currentStep, onStepChange, getStepState }: ProgressBarProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const fallbackState =
            stepNumber < currentStep
              ? 'complete'
              : stepNumber === currentStep
                ? 'active'
                : 'available';
          const state = getStepState ? getStepState(stepNumber) : fallbackState;
          const isActive = state === 'active';
          const isCompleted = state === 'complete';
          const isLocked = state === 'locked';
          const isReadonly = state === 'readonly';

          const handleStepClick = () => {
            if (isLocked) return;
            onStepChange(stepNumber);
          };

          const circleClass = isCompleted
            ? 'bg-emerald-600 text-white border-emerald-600'
            : isActive
              ? 'bg-sky-100 text-sky-700 border-sky-300'
              : isReadonly
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : isLocked
                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white text-slate-600 border-slate-300';

          const labelClass = isCompleted
            ? 'text-emerald-700'
            : isActive
              ? 'text-slate-900'
              : isReadonly
                ? 'text-amber-700'
                : isLocked
                  ? 'text-slate-400'
                  : 'text-slate-600';

          return (
            <React.Fragment key={step}>
              <div
                className={`flex min-w-[132px] items-center gap-2 rounded-lg border px-2 py-2 transition ${
                  isActive
                    ? 'border-sky-200 bg-sky-50/70'
                    : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : isReadonly
                        ? 'border-amber-200 bg-amber-50/50'
                        : isLocked
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handleStepClick}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${circleClass}`}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="leading-tight">
                  <p className={`text-xs font-semibold ${labelClass}`}>{step}</p>
                  <p className="text-[11px] text-slate-400">Step {stepNumber}</p>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div className="h-px w-4 shrink-0 bg-slate-200">
                  <div
                    className="h-px rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
