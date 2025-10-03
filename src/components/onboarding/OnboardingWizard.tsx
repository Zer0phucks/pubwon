'use client';

/**
 * Multi-step onboarding wizard with progress tracking
 * Guides new users through initial setup
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type OnboardingStep =
  | 'welcome'
  | 'connect-github'
  | 'select-repository'
  | 'review-persona'
  | 'select-subreddits'
  | 'complete';

interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
  userId: string;
}

export default function OnboardingWizard({
  initialStep = 'welcome',
  userId,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const steps: OnboardingStep[] = [
    'welcome',
    'connect-github',
    'select-repository',
    'review-persona',
    'select-subreddits',
    'complete',
  ];

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const markStepComplete = (step: OnboardingStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      markStepComplete(currentStep);
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const skipStep = () => {
    goToNextStep();
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Mark user as onboarded
      await fetch('/api/profile/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </h2>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={goToNextStep} />
          )}

          {currentStep === 'connect-github' && (
            <ConnectGitHubStep
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              onSkip={skipStep}
            />
          )}

          {currentStep === 'select-repository' && (
            <SelectRepositoryStep
              userId={userId}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === 'review-persona' && (
            <ReviewPersonaStep
              userId={userId}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              onSkip={skipStep}
            />
          )}

          {currentStep === 'select-subreddits' && (
            <SelectSubredditsStep
              userId={userId}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              onSkip={skipStep}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep
              onComplete={completeOnboarding}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Step Indicators */}
        <div className="mt-8 flex justify-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full transition-all ${
                index <= currentStepIndex
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual step components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-block p-4 bg-blue-100 rounded-full">
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to PubWon!
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Integrate customer discovery into your development cycle.
        We'll help you understand your users better by analyzing discussions
        from relevant communities and turning insights into actionable features.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Get Started
      </button>
    </div>
  );
}

function ConnectGitHubStep({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your GitHub Account</h2>
      <p className="text-gray-600 mb-6">
        Connect your GitHub account to monitor your repositories and create issues from customer feedback.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">What we'll access:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Read repository information</li>
          <li>• Create and manage issues</li>
          <li>• Access repository activity</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip for now
          </button>
          <a
            href="/api/auth/github"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Connect GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

function SelectRepositoryStep({
  userId,
  onNext,
  onBack,
}: {
  userId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  // Implementation would fetch and display user's repositories
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Repository</h2>
      <p className="text-gray-600 mb-6">
        Choose a repository to start monitoring for customer discovery.
      </p>
      {/* Repository list would go here */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ReviewPersonaStep({
  userId,
  onNext,
  onBack,
  onSkip,
}: {
  userId: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your ICP Persona</h2>
      <p className="text-gray-600 mb-6">
        We've generated an Ideal Customer Profile based on your repository.
        Review and edit as needed.
      </p>
      {/* Persona display would go here */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Looks Good
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectSubredditsStep({
  userId,
  onNext,
  onBack,
  onSkip,
}: {
  userId: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Subreddits to Monitor</h2>
      <p className="text-gray-600 mb-6">
        We've identified relevant subreddits where your target customers hang out.
        Select which ones to monitor.
      </p>
      {/* Subreddit list would go here */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({
  onComplete,
  isLoading,
}: {
  onComplete: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-block p-4 bg-green-100 rounded-full">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        You're All Set!
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Your account is configured and ready to go. We'll start monitoring your
        selected communities and analyzing customer feedback.
      </p>
      <button
        onClick={onComplete}
        disabled={isLoading}
        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
      >
        {isLoading ? 'Setting up...' : 'Go to Dashboard'}
      </button>
    </div>
  );
}
