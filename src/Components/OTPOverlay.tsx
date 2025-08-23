
import React, { useState, useEffect, useRef } from "react";

interface OtpOverlayProps {
  email: string;
  onVerifySuccess: () => void;
  onClose: () => void;
}

const OtpOverlay: React.FC<OtpOverlayProps> = ({ email, onVerifySuccess, onClose }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    // Focus on the first input when the component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (/[^0-9]/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage(null); // Clear error message on input change

    // Focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (value === "" && index > 0) {
      // Optionally, focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the full 6-digit OTP.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("http://localhost:8080/verifyotp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      if (response.ok) {
        setSuccessMessage("OTP verified successfully! Redirecting...");
        setTimeout(() => {
          onVerifySuccess();
        }, 2000); // Wait for 2 seconds before redirecting
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "OTP verification failed.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResend(false);
    setResendTimer(60);

    try {
      const response = await fetch("http://localhost:8080/sendotp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccessMessage("New OTP sent successfully!");
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErrorMessage("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Verify Your Email</h3>
        <p className="text-gray-600 text-center mb-6">
          A 6-digit OTP has been sent to <span className="font-bold">{email}</span>. Please enter it below.
        </p>

        <div className="flex justify-center space-x-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-green-600 text-center mb-4">{successMessage}</p>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleVerify}
            disabled={loading}
            className={`w-full p-3 rounded-md text-white font-semibold transition-colors
              ${loading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading && !successMessage ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={handleResendOtp}
            disabled={loading || !canResend}
            className={`w-full p-3 rounded-md text-green-700 border border-green-700 font-semibold transition-colors
              ${loading || !canResend ? "opacity-50 cursor-not-allowed" : "hover:bg-green-50"}`}
          >
            {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className={`w-full p-3 rounded-md text-gray-700 border border-gray-300 font-semibold transition-colors
              ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpOverlay;
