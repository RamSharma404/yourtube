import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useUser } from "@/lib/AuthContext";

export default function OtpVerificationModal() {
  const { pendingVerification, verifyOtp } = useUser();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setSubmitting(true);
    setError("");
    try {
      await verifyOtp(otp);
      setOtp("");
    } catch (verifyError) {
      console.error(verifyError);
      setError("Unable to verify OTP. Please retry with the latest code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(pendingVerification)} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your account</DialogTitle>
          <DialogDescription>
            {pendingVerification?.channel === "email"
              ? "We sent an OTP to your registered email."
              : "We sent an OTP to your registered mobile number."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {pendingVerification?.previewOtp && (
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Test OTP: <span className="font-semibold text-foreground">{pendingVerification.previewOtp}</span>
            </div>
          )}
          <Input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            maxLength={6}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || submitting}>
            {submitting ? "Verifying..." : "Verify OTP"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
