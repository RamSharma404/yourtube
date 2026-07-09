import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const plans = [
  { name: "Bronze", amount: 10, description: "7 minutes watch time and unlimited downloads" },
  { name: "Silver", amount: 50, description: "10 minutes watch time and unlimited downloads" },
  { name: "Gold", amount: 100, description: "Unlimited watch time and unlimited downloads" },
];

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
}

const PremiumModal = ({ isOpen, onClose, selectedPlan = "Gold" }: PremiumModalProps) => {
  const { user, setUser } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleUpgrade = async (planName: string) => {
    if (!user?._id) {
      alert("Please sign in before upgrading your plan.");
      return;
    }

    setLoadingPlan(planName);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        return;
      }

      const orderRes = await axiosInstance.post("/payment/create-order", {
        userId: user._id,
        plan: planName,
      });
      const { orderId, amount, currency, key_id, plan, mock } = orderRes.data;

      if (mock) {
        const confirmed = window.confirm(
          `Local test payment for ${plan} plan (INR ${(amount / 100).toFixed(2)}). Continue?`
        );
        if (!confirmed) return;

        const verifyRes = await axiosInstance.post("/payment/verify", {
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_payment_${Date.now()}`,
          razorpay_signature: "mock_signature",
          userId: user._id,
          plan,
        });

        setUser(verifyRes.data.user);
        alert(`Plan upgraded to ${plan}. Invoice ${verifyRes.data.invoiceNumber} has been generated.`);
        onClose();
        return;
      }

      const options = {
        key: key_id,
        amount,
        currency,
        name: "YourTube",
        description: `${plan} Plan Upgrade`,
        order_id: orderId,
        handler: async (response: RazorpayHandlerResponse) => {
          const verifyRes = await axiosInstance.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            userId: user._id,
            plan,
          });

          setUser(verifyRes.data.user);
          alert(`Plan upgraded to ${plan}. Invoice ${verifyRes.data.invoiceNumber} has been generated.`);
          onClose();
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#1d4ed8" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Upgrade error:", error);
      alert(error?.response?.data?.message || "Something went wrong while upgrading the plan.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Free users get 5 minutes and 1 download per day. Paid plans unlock more time and unlimited downloads.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-5 ${
                selectedPlan === plan.name ? "border-blue-500 bg-blue-50" : "border-border bg-background"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold">&#8377;{plan.amount}</p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
              <Button
                className="mt-5 w-full"
                onClick={() => handleUpgrade(plan.name)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.name ? "Processing..." : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
