"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Enhanced login component with improved UX features
 * - Remember me functionality
 * - Better social login layout
 * - Improved error handling
 * - Loading states
 */

export function useRememberMe() {
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tumacv_remember_me");
    if (saved !== null) {
      setRememberMe(saved === "true");
    }
  }, []);

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
    localStorage.setItem("tumacv_remember_me", !rememberMe);
  };

  return [rememberMe, toggleRememberMe];
}

export function useSocialLoginStatus() {
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check what social providers are configured
    // In a real app, this would come from an API or environment check
    const checkProviders = async () => {
      // Simulate checking provider configuration
      setGoogleEnabled(!!process.env.NEXT_PUBLIC_GOOGLE_AUTH && process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1");
      // Add other providers as they're configured
      setAppleEnabled(false); // Placeholder
      setGithubEnabled(false); // Placeholder
      setLoading(false);
    };

    checkProviders();
  }, []);

  return { googleEnabled, appleEnabled, githubEnabled, loading };
}

export function LoginFormEnhancements() {
  // These would be integrated into the existing LoginClient component
  const [rememberMe, toggleRememberMe] = useRememberMe();
  const socialStatus = useSocialLoginStatus();
  const router = useRouter();

  // Enhanced remember me functionality
  const handleLoginWithRememberMe = async (email, password) => {
    // This would be called from the existing submit function
    // Implementation would store credentials securely if rememberMe is true
    // For security, we'd typically just store a token or user ID, not raw credentials
    if (rememberMe) {
      // Store encrypted token or user identifier
      localStorage.setItem("tumacv_user_email", email);
      // In practice, you'd store a JWT or session token here
    } else {
      localStorage.removeItem("tumacv_user_email");
    }
  };

  // Auto-fill remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("tumacv_user_email");
    if (rememberedEmail) {
      // This would set the email field in the actual login form
      console.log("Remembered email:", rememberedEmail);
    }
  }, []);

  return {
    rememberMe,
    toggleRememberMe,
    socialStatus,
    handleLoginWithRememberMe
  };
}