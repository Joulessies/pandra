import { create } from "zustand";

interface SignInState {
  email: string;
  password: string;
  passwordVisible: boolean;
  focusedField: "email" | "password" | null;
  loading: boolean;
  error: string;

  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setPasswordVisible: (visible: boolean) => void;
  setFocusedField: (field: "email" | "password" | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const useSignInStore = create<SignInState>((set) => ({
  email: "",
  password: "",
  passwordVisible: false,
  focusedField: null,
  loading: false,
  error: "",

  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setPasswordVisible: (visible) => set({ passwordVisible: visible }),
  setFocusedField: (field) => set({ focusedField: field }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      email: "",
      password: "",
      passwordVisible: false,
      focusedField: null,
      loading: false,
      error: "",
    }),
}));

export interface SignUpState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  code: string;
  pendingVerification: boolean;
  passwordVisible: boolean;
  confirmPasswordVisible: boolean;
  focusedField:
    "name" | "email" | "password" | "confirmPassword" | "code" | null;
  loading: boolean;
  resendLoading: boolean;
  resendCooldown: number;
  infoMessage: string;
  error: string;

  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setCode: (code: string) => void;
  setPendingVerification: (pending: boolean) => void;
  setPasswordVisible: (visible: boolean) => void;
  setConfirmPasswordVisible: (visible: boolean) => void;
  setFocusedField: (
    field: "name" | "email" | "password" | "confirmPassword" | "code" | null,
  ) => void;
  setLoading: (loading: boolean) => void;
  setResendLoading: (loading: boolean) => void;
  setResendCooldown: (cooldown: number) => void;
  setInfoMessage: (message: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const useSignUpStore = create<SignUpState>((set) => ({
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  code: "",
  pendingVerification: false,
  passwordVisible: false,
  confirmPasswordVisible: false,
  focusedField: null,
  loading: false,
  resendLoading: false,
  resendCooldown: 0,
  infoMessage: "",
  error: "",

  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (password) => set({ confirmPassword: password }),
  setFirstName: (name) => set({ firstName: name }),
  setLastName: (name) => set({ lastName: name }),
  setCode: (code) => set({ code }),
  setPendingVerification: (pending) => set({ pendingVerification: pending }),
  setPasswordVisible: (visible) => set({ passwordVisible: visible }),
  setConfirmPasswordVisible: (visible) =>
    set({ confirmPasswordVisible: visible }),
  setFocusedField: (field) => set({ focusedField: field }),
  setLoading: (loading) => set({ loading }),
  setResendLoading: (loading) => set({ resendLoading: loading }),
  setResendCooldown: (cooldown) => set({ resendCooldown: cooldown }),
  setInfoMessage: (message) => set({ infoMessage: message }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      code: "",
      pendingVerification: false,
      passwordVisible: false,
      confirmPasswordVisible: false,
      focusedField: null,
      loading: false,
      resendLoading: false,
      resendCooldown: 0,
      infoMessage: "",
      error: "",
    }),
}));

interface ForgotPasswordState {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  passwordVisible: boolean;
  confirmPasswordVisible: boolean;
  successfulCreation: boolean;
  focusedField: "email" | "code" | "password" | "confirmPassword" | null;
  loading: boolean;
  resendLoading: boolean;
  resendCooldown: number;
  infoMessage: string;
  error: string;

  setEmail: (email: string) => void;
  setCode: (code: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setPasswordVisible: (visible: boolean) => void;
  setConfirmPasswordVisible: (visible: boolean) => void;
  setSuccessfulCreation: (success: boolean) => void;
  setFocusedField: (
    field: "email" | "code" | "password" | "confirmPassword" | null,
  ) => void;
  setLoading: (loading: boolean) => void;
  setResendLoading: (loading: boolean) => void;
  setResendCooldown: (cooldown: number) => void;
  setInfoMessage: (message: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const useForgotPasswordStore = create<ForgotPasswordState>((set) => ({
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
  passwordVisible: false,
  confirmPasswordVisible: false,
  successfulCreation: false,
  focusedField: null,
  loading: false,
  resendLoading: false,
  resendCooldown: 0,
  infoMessage: "",
  error: "",

  setEmail: (email) => set({ email }),
  setCode: (code) => set({ code }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (password) => set({ confirmPassword: password }),
  setPasswordVisible: (visible) => set({ passwordVisible: visible }),
  setConfirmPasswordVisible: (visible) =>
    set({ confirmPasswordVisible: visible }),
  setSuccessfulCreation: (success) => set({ successfulCreation: success }),
  setFocusedField: (field) => set({ focusedField: field }),
  setLoading: (loading) => set({ loading }),
  setResendLoading: (loading) => set({ resendLoading: loading }),
  setResendCooldown: (cooldown) => set({ resendCooldown: cooldown }),
  setInfoMessage: (message) => set({ infoMessage: message }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
      passwordVisible: false,
      confirmPasswordVisible: false,
      successfulCreation: false,
      focusedField: null,
      loading: false,
      resendLoading: false,
      resendCooldown: 0,
      infoMessage: "",
      error: "",
    }),
}));

export { useSignInStore, useSignUpStore, useForgotPasswordStore };
