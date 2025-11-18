import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types';
import type { Session } from '@supabase/supabase-js';

interface OnboardingTourProps {
  userProfile: UserProfile;
  session: Session | null;
  invoicesCount: number;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  userProfile,
  session,
  invoicesCount,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tasks, setTasks] = useState({
    profile: false,
    template: false,
    invoice: false
  });

  // Check if onboarding is already completed
  useEffect(() => {
    if (userProfile.onboarding_completed) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
  }, [userProfile.onboarding_completed]);

  // Check task completion status
  useEffect(() => {
    if (!session?.user || userProfile.onboarding_completed) return;

    const checkTasks = () => {
      // Task 1: Bedrijfsprofiel ingevuld
      // Check if address, kvk_number, btw_number, and iban are filled
      const profileCompleted = !!(
        userProfile.address &&
        userProfile.address.trim() !== '' &&
        userProfile.kvk_number &&
        userProfile.kvk_number.trim() !== '' &&
        userProfile.btw_number &&
        userProfile.btw_number.trim() !== '' &&
        userProfile.iban &&
        userProfile.iban.trim() !== ''
      );

      // Task 2: Template gekozen
      // Check if user has visited templates page and selected a template
      // We consider it completed if onboarding_template_completed is set to true
      // OR if template_customizations exists (user has customized)
      const templateCompleted = !!(
        userProfile.onboarding_template_completed ||
        (userProfile.template_customizations !== null && userProfile.template_customizations !== undefined)
      );

      // Task 3: Factuur gemaakt
      const invoiceCompleted = invoicesCount > 0;

      setTasks({
        profile: profileCompleted,
        template: templateCompleted,
        invoice: invoiceCompleted
      });

      // If all tasks are completed, mark onboarding as complete
      if (profileCompleted && templateCompleted && invoiceCompleted) {
        markOnboardingComplete();
      } else {
        // Update individual task status in database
        updateTaskStatus({
          profile: profileCompleted,
          template: templateCompleted,
          invoice: invoiceCompleted
        });
      }
    };

    checkTasks();
  }, [userProfile, invoicesCount, session, userProfile.onboarding_completed]);

  const updateTaskStatus = async (taskStatus: { profile: boolean; template: boolean; invoice: boolean }) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_profile_completed: taskStatus.profile,
          onboarding_template_completed: taskStatus.template,
          onboarding_invoice_completed: taskStatus.invoice,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating task status:', error);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const markOnboardingComplete = async () => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_profile_completed: true,
          onboarding_template_completed: true,
          onboarding_invoice_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error marking onboarding complete:', error);
      } else {
        setIsVisible(false);
        onComplete();
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const handleClose = async () => {
    if (!session?.user) return;

    try {
      // Mark as completed when user manually closes
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error closing onboarding:', error);
      } else {
        setIsVisible(false);
        onComplete();
      }
    } catch (error) {
      console.error('Error closing onboarding:', error);
    }
  };

  if (!isVisible || userProfile.onboarding_completed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-teal-200 p-5 max-w-sm w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-800">Rondleiding</h3>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Sluit rondleiding"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Task 1: Bedrijfsprofiel */}
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              tasks.profile
                ? 'bg-teal-500 border-teal-500'
                : 'border-zinc-300 bg-white'
            }`}>
              {tasks.profile && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${tasks.profile ? 'text-zinc-600 line-through' : 'text-zinc-800 font-medium'}`}>
              Vul bedrijfsprofiel in
            </span>
          </div>

          {/* Task 2: Template */}
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              tasks.template
                ? 'bg-teal-500 border-teal-500'
                : 'border-zinc-300 bg-white'
            }`}>
              {tasks.template && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${tasks.template ? 'text-zinc-600 line-through' : 'text-zinc-800 font-medium'}`}>
              Kies een template
            </span>
          </div>

          {/* Task 3: Factuur */}
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              tasks.invoice
                ? 'bg-teal-500 border-teal-500'
                : 'border-zinc-300 bg-white'
            }`}>
              {tasks.invoice && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${tasks.invoice ? 'text-zinc-600 line-through' : 'text-zinc-800 font-medium'}`}>
              Maak een factuur
            </span>
          </div>
        </div>

        {tasks.profile && tasks.template && tasks.invoice && (
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <p className="text-xs text-teal-600 font-medium text-center">
              🎉 Alle taken voltooid! De rondleiding verdwijnt automatisch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

