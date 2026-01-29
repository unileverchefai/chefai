import { hasToken } from '@auth/tokenManager.js';
import { register } from '@auth/authService.js';
import openSubscriptionStep1 from './subscription-step1.js';
import openSubscriptionStep2 from './subscription-step2.js';
import openSubscriptionStep3 from './subscription-step3.js';
import openSubscriptionStep4 from './subscription-step4.js';

export default function openSubscriptionFlow() {
  const isLoggedIn = hasToken();

  openSubscriptionStep1((formData) => {
    if (isLoggedIn) {
      openSubscriptionStep2(
        () => {
        },
        () => {
        },
      );
    } else {
      openSubscriptionStep2(
        () => {
          openSubscriptionStep3(formData, async (updatedFormData) => {
            const tempPassword = `Tmp!${Math.random().toString(36).slice(-8)}A1`;

            const registrationData = {
              email: updatedFormData.email,
              password: tempPassword,
              confirmPassword: tempPassword,
              firstName: updatedFormData.firstName,
              lastName: updatedFormData.lastName,
              businessType: updatedFormData.businessType,
              mobilePhone: updatedFormData.phoneNumber || '',
              marketingConsent: updatedFormData.marketingConsent || false,
            };

            try {
              await register(registrationData);
              openSubscriptionStep4(updatedFormData.email);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Registration failed:', error);
            }
          });
        },
        () => {
        },
      );
    }
  });
}

export function setupSubscriptionFlowTriggers() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a[href="#subscription-flow"]');
    if (!trigger) return;

    event.preventDefault();
    openSubscriptionFlow();
  });
}
