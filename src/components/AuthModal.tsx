import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Smartphone,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { authService } from "../services/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole: "user" | "admin";
  initialIsRegister: boolean;
  onAuthSuccess: (profile: any) => void;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialRole,
  initialIsRegister,
  onAuthSuccess,
  onShowToast,
}: AuthModalProps) {
  const [role, setRole] = useState<"user" | "admin">(initialRole);
  const [isRegister, setIsRegister] = useState(initialIsRegister);

  // Sync inputs with modal open props
  useEffect(() => {
    setRole(initialRole);
    setIsRegister(initialIsRegister);
  }, [initialRole, initialIsRegister, isOpen]);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP simulation states
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Handle triggering simulated OTP sms
  const triggerOtpSend = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      onShowToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }
    setIsSendingOtp(true);

    // Simulate short network delay
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setIsSendingOtp(false);
      onShowToast(
        `SMS OTP Sent to +91-${mobileNumber}! Simulated activation pin is: ${code}`,
        "success"
      );
    }, 1200);
  };

  // Handle checking validation code
  const handleVerifyOtp = () => {
    if (inputOtp === generatedOtp && inputOtp !== "") {
      setOtpVerified(true);
      onShowToast("Mobile OTP code verified successfully!", "success");
    } else {
      onShowToast("Incorrect OTP code. Please retry.", "error");
    }
  };

  // Handle submit Registration or login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        // Sign Up validations
        if (password !== confirmPassword) {
          onShowToast("Passwords do not match.", "error");
          setIsLoading(false);
          return;
        }
        if (!otpVerified) {
          onShowToast("Please complete the mobile OTP Verification first.", "error");
          setIsLoading(false);
          return;
        }

        // API registration
        const response = await authService.register(fullName, email, mobileNumber, password, role);
        authService.setAuthToken(response.token);

        onShowToast(`${role === "admin" ? "Admin" : "User"} profile registered!`, "success");
        onAuthSuccess(response.user);
        onClose();
      } else {
        // Sign In
        const response = await authService.login(email, password);
        authService.setAuthToken(response.token);

        onShowToast(`Signed in successfully!`, "success");
        onAuthSuccess(response.user);
        onClose();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Authentication failed.";
      onShowToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-2xl overflow-hidden glass-card">
        {/* Close trigger button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 bg-white/3 hover:bg-white/10 border border-white/5 rounded-full text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header content styling */}
        <div className="flex flex-col items-center mb-6 pt-2 select-none">
          <div className="p-3.5 bg-white/5 rounded-full border border-[#C5A059]/25 text-[#C5A059] mb-3 shadow-[0_0_15px_rgba(197,160,89,0.15)] animate-pulse">
            {role === "admin" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-white text-center">
            {isRegister
              ? `Register Profile`
              : `${role === "admin" ? "Admin" : "Member"} Access`}
          </h2>
          <p className="text-[#C5A059] text-[9px] uppercase font-bold tracking-[0.2em] text-center mt-1">
            Leature Secured Interface
          </p>
        </div>

        {/* Tab Selector User vs Admin */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-1 rounded-full mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-full transition-all cursor-pointer ${
              role === "user" ? "bg-white/5 text-[#F1D299]" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-full transition-all cursor-pointer ${
              role === "admin" ? "bg-white/5 text-[#F1D299]" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Admin Vault
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-stone-400 pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-stone-100 text-sm focus:border-[#C5A059]/40 outline-none transition-all placeholder-stone-600"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-stone-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-stone-100 text-sm focus:border-[#C5A059]/40 outline-none transition-all placeholder-stone-600"
              />
            </div>
          </div>

          {/* OTP and Mobile trigger on SIGN UP */}
          {isRegister && (
            <div className="flex flex-col gap-3 p-3 bg-white/2 border border-white/5 rounded-xl">
              <label className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold block pl-1">Mobile Authentication</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={mobileNumber}
                    disabled={otpVerified}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-stone-100 text-sm focus:border-[#C5A059]/40 outline-none disabled:opacity-55 font-mono placeholder-stone-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={otpVerified || isSendingOtp}
                  onClick={triggerOtpSend}
                  className="px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] disabled:bg-[#1a1a1a] disabled:text-stone-500 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shrink-0 hover:opacity-90"
                >
                  {isSendingOtp ? "Sending..." : otpVerified ? "Verified" : "Send PIN"}
                </button>
              </div>

              {/* OTP Code validation input */}
              {otpSent && !otpVerified && (
                <div className="flex gap-2 animate-fadeIn pt-1">
                  <div className="relative flex-1">
                    <Smartphone className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      placeholder="6-digit PIN"
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-stone-950 border border-white/10 rounded-xl text-stone-100 text-sm font-mono text-center tracking-widest focus:border-[#C5A059]/40 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 py-2 bg-[#0a0a0a] border border-white/10 text-[#C5A059] text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-white/5"
                  >
                    Verify
                  </button>
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center gap-2 text-[10px] text-[#C5A059] font-bold font-mono pl-1 tracking-wider uppercase">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Verified Device Profile</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-stone-400 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-stone-100 text-sm focus:border-[#C5A059]/40 outline-none font-mono transition-all"
              />
            </div>
          </div>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-stone-400 pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-stone-100 text-sm focus:border-[#C5A059]/40 outline-none font-mono transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] disabled:from-stone-800 disabled:text-stone-500 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)] hover:opacity-90 cursor-pointer flex justify-center items-center"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              "Create Member Profile"
            ) : (
              "Unlock Member Session"
            )}
          </button>
        </form>

        {/* Change register/sign-in view trigger links */}
        <div className="mt-6 text-center text-xs text-stone-500">
          {isRegister ? "Already registered at Leature?" : "New to Leature Movies?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setOtpSent(false);
              setOtpVerified(false);
              setInputOtp("");
              setGeneratedOtp("");
            }}
            className="text-[#C5A059] hover:text-[#F1D299] font-bold transition-all underline outline-none cursor-pointer"
          >
            {isRegister ? "Login instead" : "Create account"}
          </button>
        </div>

        {/* Special Bootstrapped Admin Alert Info */}
        {role === "admin" && (
          <div className="mt-5 p-4 bg-white/2 border border-white/5 rounded-2xl flex gap-2 items-start text-stone-500 font-mono text-[9px] leading-relaxed">
            <HelpCircle className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <span>
              * Under security rules, the developer email (sadha2299@gmail.com) is dynamically mapped as super admin write capability.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
// 
