import { LegalScreen } from '@/src/components/LegalScreen';
import { privacyPolicyUK, privacyPolicyEN } from '@/src/legal/privacyPolicy';

export default function PrivacyPolicyScreen() {
  return <LegalScreen docUK={privacyPolicyUK} docEN={privacyPolicyEN} />;
}
