// src/features/consultation/components/ProgressBar.tsx

import React from 'react';

const STEPS = [
  "Clinical Examination",
  "Procedure",
  "Prescription",
  "Billing",
  "Schedule follow up / Refer",
];

// 1. Update the props type to accept the new function
type ProgressBarProps = {
  currentStep: number;
  onStepChange: (step: number) => void; // <-- ADD THIS
};

// 2. Destructure the new onStepChange prop
export default function ProgressBar({ currentStep, onStepChange }: ProgressBarProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          // Helper function to handle the click
          const handleStepClick = () => {
            onStepChange(stepNumber);
          };

          return (
            <React.Fragment key={step}>
              {/* Step */}
              {/* 3. Add onClick and cursor-pointer to this wrapper div */}
              <div
                className="flex items-center gap-3 cursor-pointer" // <-- ADDED cursor-pointer
                onClick={handleStepClick} // <-- ADDED onClick
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-sky-500 text-white'
                      : isActive
                      ? 'bg-sky-100 text-sky-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <div>
                  <p
                    className={`font-semibold transition-colors duration-300 ${
                      isActive ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </p>
                  <p className="text-xs text-slate-400">Step {stepNumber}</p>
                </div>
              </div>

              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-4 h-1 rounded-full bg-slate-100">
                  <div
                    className="h-1 rounded-full bg-sky-500 transition-all duration-500"
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