import { LegalScreen } from '@/src/components/LegalScreen';
import { termsOfServiceUK, termsOfServiceEN } from '@/src/legal/termsOfService';

export default function TermsOfServiceScreen() {
  return <LegalScreen docUK={termsOfServiceUK} docEN={termsOfServiceEN} />;
}
