import { hasToken } from '@auth/tokenManager.js';
import openSubscriptionStep1 from './subscription-step1.js';
import openSubscriptionStep2 from './subscription-step2.js';
import openSubscriptionStep3 from './subscription-step3.js';

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
            const registrationData = {
              email: updatedFormData.email,
              firstName: updatedFormData.firstName,
              lastName: updatedFormData.lastName,
              businessType: updatedFormData.businessType,
              mobilePhone: updatedFormData.phoneNumber || '',
              marketingConsent: updatedFormData.marketingConsent || false,
            };

            const { default: openSignupPasswordModal } = await import('../signup/signup-password.js');
            openSignupPasswordModal(updatedFormData.email, registrationData);
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
