import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-4">
      <OnboardingFlow onComplete={handleComplete} />
    </div>
  );
};

export default OnboardingPage;