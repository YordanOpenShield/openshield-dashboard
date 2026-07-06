"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SSOProvider {
  providerId: string;
  type: "oidc" | "saml";
  issuer: string;
  domain: string;
  organizationId: string | null;
  domainVerified: boolean;
  oidcConfig?: {
    discoveryEndpoint: string;
    clientIdLastFour: string;
    pkce: boolean;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userInfoEndpoint?: string;
    jwksEndpoint?: string;
    scopes?: string[];
    tokenEndpointAuthentication?: "client_secret_post" | "client_secret_basic";
  };
  samlConfig?: {
    entryPoint: string;
    callbackUrl: string;
    audience?: string;
    wantAssertionsSigned?: boolean;
    authnRequestsSigned?: boolean;
    identifierFormat?: string;
    signatureAlgorithm?: string;
    digestAlgorithm?: string;
    certificate?: {
      fingerprintSha256?: string;
      notBefore?: string;
      notAfter?: string;
      publicKeyAlgorithm?: string;
      error?: string;
    };
  };
  spMetadataUrl: string;
}

interface OIDCFormData {
  clientId: string;
  clientSecret: string;
  discoveryEndpoint: string;
  pkce: boolean;
  scopes: string;
  tokenEndpointAuthentication: "client_secret_post" | "client_secret_basic";
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  jwksEndpoint?: string;
  mappingId: string;
  mappingEmail: string;
  mappingName: string;
}

interface SAMLFormData {
  entryPoint: string;
  cert: string;
  callbackUrl: string;
  audience?: string;
  wantAssertionsSigned: boolean;
  authnRequestsSigned: boolean;
  signatureAlgorithm: string;
  digestAlgorithm: string;
  identifierFormat: string;
  mappingId: string;
  mappingEmail: string;
  mappingName: string;
  mappingFirstName: string;
  mappingLastName: string;
}

interface ProviderFormData {
  providerId: string;
  issuer: string;
  domain: string;
  type: "oidc" | "saml";
  oidc: OIDCFormData;
  saml: SAMLFormData;
}

const defaultOIDCForm: OIDCFormData = {
  clientId: "",
  clientSecret: "",
  discoveryEndpoint: "",
  pkce: true,
  scopes: "openid,email,profile",
  tokenEndpointAuthentication: "client_secret_post",
  authorizationEndpoint: "",
  tokenEndpoint: "",
  userInfoEndpoint: "",
  jwksEndpoint: "",
  mappingId: "sub",
  mappingEmail: "email",
  mappingName: "name",
};

const defaultSAMLForm: SAMLFormData = {
  entryPoint: "",
  cert: "",
  callbackUrl: "",
  audience: "",
  wantAssertionsSigned: true,
  authnRequestsSigned: false,
  signatureAlgorithm: "rsa-sha256",
  digestAlgorithm: "sha256",
  identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  mappingId: "nameID",
  mappingEmail: "email",
  mappingName: "displayName",
  mappingFirstName: "firstName",
  mappingLastName: "lastName",
};

const defaultForm: ProviderFormData = {
  providerId: "",
  issuer: "",
  domain: "",
  type: "oidc",
  oidc: { ...defaultOIDCForm },
  saml: { ...defaultSAMLForm },
};

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500/10 border-green-500/20 text-green-400"
      : "bg-red-500/10 border-red-500/20 text-red-400";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className={`${bgColor} px-4 py-2.5 rounded-lg text-sm font-medium`}>
        {message}
      </div>
    </div>
  );
}

// ─── Modal Component ─────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isLoading,
  isDanger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  isDanger?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────────────

function FormField({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-1.5">{description}</p>
      )}
      {children}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 ${className || ""}`}
    />
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 ${className || ""}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2 focus:ring-offset-0 cursor-pointer"
      />
      <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-200">
        {label}
      </span>
    </label>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200"
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminSSOPage() {
  // Providers list state
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ProviderFormData>({ ...defaultForm, oidc: { ...defaultOIDCForm }, saml: { ...defaultSAMLForm } });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal state
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);
  const [editForm, setEditForm] = useState<ProviderFormData>({ ...defaultForm, oidc: { ...defaultOIDCForm }, saml: { ...defaultSAMLForm } });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingProvider, setDeletingProvider] = useState<SSOProvider | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Detail view state
  const [detailProvider, setDetailProvider] = useState<SSOProvider | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Fetch providers ───────────────────────────────────────────────────────

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.sso.providers();
      if (error) throw new Error(error.message || "Failed to fetch providers");
      setProviders((data?.providers ?? []) as SSOProvider[]);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load SSO providers", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const updateForm = (field: keyof ProviderFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateOIDCForm = (field: keyof OIDCFormData, value: any) => {
    setForm((prev) => ({ ...prev, oidc: { ...prev.oidc, [field]: value } }));
  };

  const updateSAMLForm = (field: keyof SAMLFormData, value: any) => {
    setForm((prev) => ({ ...prev, saml: { ...prev.saml, [field]: value } }));
  };

  const updateEditForm = (field: keyof ProviderFormData, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditOIDCForm = (field: keyof OIDCFormData, value: any) => {
    setEditForm((prev) => ({ ...prev, oidc: { ...prev.oidc, [field]: value } }));
  };

  const updateEditSAMLForm = (field: keyof SAMLFormData, value: any) => {
    setEditForm((prev) => ({ ...prev, saml: { ...prev.saml, [field]: value } }));
  };

  // ─── Open create modal ─────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...defaultForm, oidc: { ...defaultOIDCForm }, saml: { ...defaultSAMLForm } });
    setShowCreate(true);
  };

  // ─── Open edit modal ───────────────────────────────────────────────────────

  const openEdit = (provider: SSOProvider) => {
    const editData: ProviderFormData = {
      providerId: provider.providerId,
      issuer: provider.issuer,
      domain: provider.domain,
      type: provider.type,
      oidc: {
        clientId: "",
        clientSecret: "",
        discoveryEndpoint: provider.oidcConfig?.discoveryEndpoint || "",
        pkce: provider.oidcConfig?.pkce ?? true,
        scopes: provider.oidcConfig?.scopes?.join(",") || "openid,email,profile",
        tokenEndpointAuthentication: provider.oidcConfig?.tokenEndpointAuthentication || "client_secret_post",
        authorizationEndpoint: provider.oidcConfig?.authorizationEndpoint || "",
        tokenEndpoint: provider.oidcConfig?.tokenEndpoint || "",
        userInfoEndpoint: provider.oidcConfig?.userInfoEndpoint || "",
        jwksEndpoint: provider.oidcConfig?.jwksEndpoint || "",
        mappingId: "sub",
        mappingEmail: "email",
        mappingName: "name",
      },
      saml: {
        entryPoint: provider.samlConfig?.entryPoint || "",
        cert: "",
        callbackUrl: provider.samlConfig?.callbackUrl || "",
        audience: provider.samlConfig?.audience || "",
        wantAssertionsSigned: provider.samlConfig?.wantAssertionsSigned ?? true,
        authnRequestsSigned: provider.samlConfig?.authnRequestsSigned ?? false,
        signatureAlgorithm: provider.samlConfig?.signatureAlgorithm || "rsa-sha256",
        digestAlgorithm: provider.samlConfig?.digestAlgorithm || "sha256",
        identifierFormat: provider.samlConfig?.identifierFormat || "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
        mappingId: "nameID",
        mappingEmail: "email",
        mappingName: "displayName",
        mappingFirstName: "firstName",
        mappingLastName: "lastName",
      },
    };
    setEditingProvider(provider);
    setEditForm(editData);
  };

  // ─── Create provider ───────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setForm({ ...defaultForm, oidc: { ...defaultOIDCForm }, saml: { ...defaultSAMLForm } });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const body: Record<string, any> = {
        providerId: form.providerId,
        issuer: form.issuer,
        domain: form.domain,
      };

      if (form.type === "oidc") {
        const scopes = form.oidc.scopes.split(",").map((s) => s.trim()).filter(Boolean);
        body.oidcConfig = {
          clientId: form.oidc.clientId,
          clientSecret: form.oidc.clientSecret,
          discoveryEndpoint: form.oidc.discoveryEndpoint,
          pkce: form.oidc.pkce,
          scopes,
          tokenEndpointAuthentication: form.oidc.tokenEndpointAuthentication,
          mapping: {
            id: form.oidc.mappingId,
            email: form.oidc.mappingEmail,
            name: form.oidc.mappingName,
          },
        };
        if (form.oidc.authorizationEndpoint) body.oidcConfig.authorizationEndpoint = form.oidc.authorizationEndpoint;
        if (form.oidc.tokenEndpoint) body.oidcConfig.tokenEndpoint = form.oidc.tokenEndpoint;
        if (form.oidc.userInfoEndpoint) body.oidcConfig.userInfoEndpoint = form.oidc.userInfoEndpoint;
        if (form.oidc.jwksEndpoint) body.oidcConfig.jwksEndpoint = form.oidc.jwksEndpoint;
      } else {
        body.samlConfig = {
          entryPoint: form.saml.entryPoint,
          cert: form.saml.cert,
          callbackUrl: form.saml.callbackUrl,
          wantAssertionsSigned: form.saml.wantAssertionsSigned,
          authnRequestsSigned: form.saml.authnRequestsSigned,
          signatureAlgorithm: form.saml.signatureAlgorithm,
          digestAlgorithm: form.saml.digestAlgorithm,
          identifierFormat: form.saml.identifierFormat,
          mapping: {
            id: form.saml.mappingId,
            email: form.saml.mappingEmail,
            name: form.saml.mappingName,
            firstName: form.saml.mappingFirstName,
            lastName: form.saml.mappingLastName,
          },
        };
        if (form.saml.audience) body.samlConfig.audience = form.saml.audience;
      }

      const { error } = await authClient.sso.register(body as any);
      if (error) throw new Error(error.message || "Failed to register provider");

      setToast({ message: "SSO provider registered successfully", type: "success" });
      setShowCreate(false);
      resetCreateForm();
      fetchProviders();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to register provider", type: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Update provider ───────────────────────────────────────────────────────

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setEditLoading(true);
    try {
      const body: Record<string, any> = {
        providerId: editForm.providerId,
      };
      if (editForm.issuer !== editingProvider.issuer) body.issuer = editForm.issuer;
      if (editForm.domain !== editingProvider.domain) body.domain = editForm.domain;

      if (editForm.type === "oidc" && editingProvider.oidcConfig) {
        body.oidcConfig = {};
        const oidc = editForm.oidc;
        if (oidc.discoveryEndpoint !== editingProvider.oidcConfig.discoveryEndpoint) {
          body.oidcConfig.discoveryEndpoint = oidc.discoveryEndpoint;
        }
        if (oidc.pkce !== editingProvider.oidcConfig.pkce) {
          body.oidcConfig.pkce = oidc.pkce;
        }
        const currentScopes = editingProvider.oidcConfig.scopes?.join(",") || "";
        if (oidc.scopes !== currentScopes) {
          body.oidcConfig.scopes = oidc.scopes.split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (oidc.tokenEndpointAuthentication !== editingProvider.oidcConfig.tokenEndpointAuthentication) {
          body.oidcConfig.tokenEndpointAuthentication = oidc.tokenEndpointAuthentication;
        }
        if (Object.keys(body.oidcConfig).length === 0) delete body.oidcConfig;
      }

      if (editForm.type === "saml" && editingProvider.samlConfig) {
        body.samlConfig = {};
        const saml = editForm.saml;
        if (saml.entryPoint !== editingProvider.samlConfig.entryPoint) {
          body.samlConfig.entryPoint = saml.entryPoint;
        }
        if (saml.callbackUrl !== editingProvider.samlConfig.callbackUrl) {
          body.samlConfig.callbackUrl = saml.callbackUrl;
        }
        if (saml.audience !== editingProvider.samlConfig.audience) {
          body.samlConfig.audience = saml.audience;
        }
        if (saml.wantAssertionsSigned !== editingProvider.samlConfig.wantAssertionsSigned) {
          body.samlConfig.wantAssertionsSigned = saml.wantAssertionsSigned;
        }
        if (saml.authnRequestsSigned !== editingProvider.samlConfig.authnRequestsSigned) {
          body.samlConfig.authnRequestsSigned = saml.authnRequestsSigned;
        }
        if (saml.signatureAlgorithm !== editingProvider.samlConfig.signatureAlgorithm) {
          body.samlConfig.signatureAlgorithm = saml.signatureAlgorithm;
        }
        if (saml.digestAlgorithm !== editingProvider.samlConfig.digestAlgorithm) {
          body.samlConfig.digestAlgorithm = saml.digestAlgorithm;
        }
        if (Object.keys(body.samlConfig).length === 0) delete body.samlConfig;
      }

      const { error } = await authClient.sso.updateProvider(body as any);
      if (error) throw new Error(error.message || "Failed to update provider");

      setToast({ message: "SSO provider updated successfully", type: "success" });
      setEditingProvider(null);
      fetchProviders();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update provider", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Delete provider ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingProvider) return;
    setDeleteLoading(true);
    try {
      const { error } = await authClient.sso.deleteProvider({
        providerId: deletingProvider.providerId,
      });
      if (error) throw new Error(error.message || "Failed to delete provider");

      setToast({ message: "SSO provider deleted successfully", type: "success" });
      setDeletingProvider(null);
      fetchProviders();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete provider", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">SSO Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage Single Sign-On providers ({providers.length} total)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Provider
        </button>
      </div>

      {/* Providers Table */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-4 bg-white/5 rounded animate-pulse"
                          style={{ width: `${["35%", "20%", "30%", "40%", "25%", "15%"][j]}` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span>No SSO providers configured</span>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors duration-200"
                      >
                        Add your first provider
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr
                    key={provider.providerId}
                    className="hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs shrink-0 ${
                          provider.type === "oidc"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {provider.type === "oidc" ? "O" : "S"}
                        </div>
                        <div>
                          <span className="text-sm text-gray-200 font-medium">
                            {provider.providerId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                        provider.type === "oidc"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}>
                        {provider.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300 font-mono">
                        {provider.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400 truncate max-w-[200px] inline-block align-middle" title={provider.issuer}>
                        {provider.issuer.length > 40
                          ? provider.issuer.slice(0, 40) + "..."
                          : provider.issuer}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {provider.domainVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailProvider(provider)}
                          className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all duration-200"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(provider)}
                          className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all duration-200"
                          title="Edit provider"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProvider(provider)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                          title="Delete provider"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Create Provider Modal ──────────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Register SSO Provider"
        subtitle="Configure a new OIDC or SAML identity provider"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Provider Type Toggle */}
          <div className="flex gap-2 p-1 bg-[#0d0d0d] border border-white/10 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => updateForm("type", "oidc")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                form.type === "oidc"
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              OIDC
            </button>
            <button
              type="button"
              onClick={() => updateForm("type", "saml")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                form.type === "saml"
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              SAML
            </button>
          </div>

          {/* Basic Info */}
          <SectionHeader title="Basic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Provider ID" description="Unique identifier (e.g., 'okta', 'azure-ad')">
              <Input
                value={form.providerId}
                onChange={(v) => updateForm("providerId", v)}
                placeholder="my-identity-provider"
                required
              />
            </FormField>
            <FormField label="Domain" description="Email domain to match (e.g., 'company.com')">
              <Input
                value={form.domain}
                onChange={(v) => updateForm("domain", v)}
                placeholder="company.com"
                required
              />
            </FormField>
            <FormField label="Issuer" description="The issuer URL from the identity provider" className="sm:col-span-2">
              <Input
                value={form.issuer}
                onChange={(v) => updateForm("issuer", v)}
                placeholder="https://your-org.okta.com"
                required
              />
            </FormField>
          </div>

          {/* OIDC Config */}
          {form.type === "oidc" && (
            <>
              <SectionHeader title="OIDC Configuration" description="OpenID Connect provider settings" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Client ID" description="OIDC client identifier">
                  <Input
                    value={form.oidc.clientId}
                    onChange={(v) => updateOIDCForm("clientId", v)}
                    placeholder="your-client-id"
                    required
                  />
                </FormField>
                <FormField label="Client Secret" description="OIDC client secret">
                  <Input
                    type="password"
                    value={form.oidc.clientSecret}
                    onChange={(v) => updateOIDCForm("clientSecret", v)}
                    placeholder="••••••••"
                    required
                  />
                </FormField>
                <FormField label="Discovery Endpoint" description="OpenID Connect discovery URL" className="sm:col-span-2">
                  <Input
                    value={form.oidc.discoveryEndpoint}
                    onChange={(v) => updateOIDCForm("discoveryEndpoint", v)}
                    placeholder="https://your-org.okta.com/.well-known/openid-configuration"
                    required
                  />
                </FormField>
                <FormField label="Authorization Endpoint" description="(Optional) Override authorization URL">
                  <Input
                    value={form.oidc.authorizationEndpoint || ""}
                    onChange={(v) => updateOIDCForm("authorizationEndpoint", v)}
                    placeholder="https://your-org.okta.com/oauth2/v1/authorize"
                  />
                </FormField>
                <FormField label="Token Endpoint" description="(Optional) Override token URL">
                  <Input
                    value={form.oidc.tokenEndpoint || ""}
                    onChange={(v) => updateOIDCForm("tokenEndpoint", v)}
                    placeholder="https://your-org.okta.com/oauth2/v1/token"
                  />
                </FormField>
                <FormField label="UserInfo Endpoint" description="(Optional) Override userinfo URL">
                  <Input
                    value={form.oidc.userInfoEndpoint || ""}
                    onChange={(v) => updateOIDCForm("userInfoEndpoint", v)}
                    placeholder="https://your-org.okta.com/oauth2/v1/userinfo"
                  />
                </FormField>
                <FormField label="JWKS Endpoint" description="(Optional) Override JWKS URL">
                  <Input
                    value={form.oidc.jwksEndpoint || ""}
                    onChange={(v) => updateOIDCForm("jwksEndpoint", v)}
                    placeholder="https://your-org.okta.com/oauth2/v1/keys"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Token Endpoint Authentication" description="Authentication method for the token endpoint">
                  <Select
                    value={form.oidc.tokenEndpointAuthentication}
                    onChange={(v) => updateOIDCForm("tokenEndpointAuthentication", v as any)}
                    options={[
                      { value: "client_secret_post", label: "Client Secret (POST)" },
                      { value: "client_secret_basic", label: "Client Secret (Basic Auth)" },
                    ]}
                  />
                </FormField>
                <FormField label="Scopes" description="Comma-separated list of OIDC scopes">
                  <Input
                    value={form.oidc.scopes}
                    onChange={(v) => updateOIDCForm("scopes", v)}
                    placeholder="openid,email,profile"
                  />
                </FormField>
              </div>

              <Checkbox
                checked={form.oidc.pkce}
                onChange={(v) => updateOIDCForm("pkce", v)}
                label="Use PKCE (Proof Key for Code Exchange)"
              />

              <SectionHeader title="Attribute Mapping" description="Map OIDC claims to user fields" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="User ID">
                  <Input value={form.oidc.mappingId} onChange={(v) => updateOIDCForm("mappingId", v)} placeholder="sub" />
                </FormField>
                <FormField label="Email">
                  <Input value={form.oidc.mappingEmail} onChange={(v) => updateOIDCForm("mappingEmail", v)} placeholder="email" />
                </FormField>
                <FormField label="Display Name">
                  <Input value={form.oidc.mappingName} onChange={(v) => updateOIDCForm("mappingName", v)} placeholder="name" />
                </FormField>
              </div>
            </>
          )}

          {/* SAML Config */}
          {form.type === "saml" && (
            <>
              <SectionHeader title="SAML Configuration" description="SAML 2.0 identity provider settings" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="SSO Entry Point" description="IdP Single Sign-On URL">
                  <Input
                    value={form.saml.entryPoint}
                    onChange={(v) => updateSAMLForm("entryPoint", v)}
                    placeholder="https://idp.company.com/sso"
                    required
                  />
                </FormField>
                <FormField label="Callback URL" description="SP Assertion Consumer Service URL">
                  <Input
                    value={form.saml.callbackUrl}
                    onChange={(v) => updateSAMLForm("callbackUrl", v)}
                    placeholder="https://yourapp.com/api/auth/sso/saml2/callback/providerId"
                    required
                  />
                </FormField>
                <FormField label="Audience" description="(Optional) SP entity ID / audience">
                  <Input
                    value={form.saml.audience || ""}
                    onChange={(v) => updateSAMLForm("audience", v)}
                    placeholder="https://yourapp.com"
                  />
                </FormField>
              </div>

              <FormField label="IdP Certificate (X.509)" description="PEM-encoded certificate from the identity provider">
                <textarea
                  value={form.saml.cert}
                  onChange={(e) => updateSAMLForm("cert", e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  required
                  rows={4}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Signature Algorithm" description="Algorithm used for digital signatures">
                  <Select
                    value={form.saml.signatureAlgorithm}
                    onChange={(v) => updateSAMLForm("signatureAlgorithm", v)}
                    options={[
                      { value: "rsa-sha256", label: "RSA-SHA256" },
                      { value: "rsa-sha1", label: "RSA-SHA1" },
                      { value: "rsa-sha384", label: "RSA-SHA384" },
                      { value: "rsa-sha512", label: "RSA-SHA512" },
                    ]}
                  />
                </FormField>
                <FormField label="Digest Algorithm" description="Algorithm used for digest calculation">
                  <Select
                    value={form.saml.digestAlgorithm}
                    onChange={(v) => updateSAMLForm("digestAlgorithm", v)}
                    options={[
                      { value: "sha256", label: "SHA-256" },
                      { value: "sha1", label: "SHA-1" },
                      { value: "sha384", label: "SHA-384" },
                      { value: "sha512", label: "SHA-512" },
                    ]}
                  />
                </FormField>
                <FormField label="Name ID Format" description="Format of the SAML NameID">
                  <Select
                    value={form.saml.identifierFormat}
                    onChange={(v) => updateSAMLForm("identifierFormat", v)}
                    options={[
                      { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent", label: "Persistent" },
                      { value: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress", label: "Email Address" },
                      { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient", label: "Transient" },
                      { value: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified", label: "Unspecified" },
                    ]}
                  />
                </FormField>
              </div>

              <div className="flex gap-6">
                <Checkbox
                  checked={form.saml.wantAssertionsSigned}
                  onChange={(v) => updateSAMLForm("wantAssertionsSigned", v)}
                  label="Require signed assertions"
                />
                <Checkbox
                  checked={form.saml.authnRequestsSigned}
                  onChange={(v) => updateSAMLForm("authnRequestsSigned", v)}
                  label="Sign authentication requests"
                />
              </div>

              <SectionHeader title="Attribute Mapping" description="Map SAML attributes to user fields" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="User ID">
                  <Input value={form.saml.mappingId} onChange={(v) => updateSAMLForm("mappingId", v)} placeholder="nameID" />
                </FormField>
                <FormField label="Email">
                  <Input value={form.saml.mappingEmail} onChange={(v) => updateSAMLForm("mappingEmail", v)} placeholder="email" />
                </FormField>
                <FormField label="Display Name">
                  <Input value={form.saml.mappingName} onChange={(v) => updateSAMLForm("mappingName", v)} placeholder="displayName" />
                </FormField>
                <FormField label="First Name">
                  <Input value={form.saml.mappingFirstName} onChange={(v) => updateSAMLForm("mappingFirstName", v)} placeholder="firstName" />
                </FormField>
                <FormField label="Last Name">
                  <Input value={form.saml.mappingLastName} onChange={(v) => updateSAMLForm("mappingLastName", v)} placeholder="lastName" />
                </FormField>
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setShowCreate(false); resetCreateForm(); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {createLoading ? "Registering..." : "Register Provider"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Provider Modal ────────────────────────────────────────────── */}
      <Modal
        open={editingProvider !== null}
        onClose={() => setEditingProvider(null)}
        title={`Edit Provider — ${editingProvider?.providerId || ""}`}
        subtitle="Update SSO provider configuration"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Provider Type Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
              editForm.type === "oidc"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}>
              {editForm.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">Provider type cannot be changed after creation</span>
          </div>

          {/* Basic Info */}
          <SectionHeader title="Basic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Provider ID">
              <input
                type="text"
                value={editForm.providerId}
                disabled
                className="w-full bg-[#0d0d0d] border border-white/5 rounded-lg px-3 py-2.5 text-gray-500 cursor-not-allowed"
              />
            </FormField>
            <FormField label="Domain">
              <Input
                value={editForm.domain}
                onChange={(v) => updateEditForm("domain", v)}
                placeholder="company.com"
                required
              />
            </FormField>
            <FormField label="Issuer" className="sm:col-span-2">
              <Input
                value={editForm.issuer}
                onChange={(v) => updateEditForm("issuer", v)}
                placeholder="https://your-org.okta.com"
                required
              />
            </FormField>
          </div>

          {/* Editable OIDC Config */}
          {editForm.type === "oidc" && editingProvider?.oidcConfig && (
            <>
              <SectionHeader title="OIDC Configuration" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Discovery Endpoint">
                  <Input
                    value={editForm.oidc.discoveryEndpoint}
                    onChange={(v) => updateEditOIDCForm("discoveryEndpoint", v)}
                    placeholder="https://your-org.okta.com/.well-known/openid-configuration"
                  />
                </FormField>
                <FormField label="Token Endpoint Authentication">
                  <Select
                    value={editForm.oidc.tokenEndpointAuthentication}
                    onChange={(v) => updateEditOIDCForm("tokenEndpointAuthentication", v as any)}
                    options={[
                      { value: "client_secret_post", label: "Client Secret (POST)" },
                      { value: "client_secret_basic", label: "Client Secret (Basic Auth)" },
                    ]}
                  />
                </FormField>
                <FormField label="Scopes" className="sm:col-span-2">
                  <Input
                    value={editForm.oidc.scopes}
                    onChange={(v) => updateEditOIDCForm("scopes", v)}
                    placeholder="openid,email,profile"
                  />
                </FormField>
              </div>
              <Checkbox
                checked={editForm.oidc.pkce}
                onChange={(v) => updateEditOIDCForm("pkce", v)}
                label="Use PKCE"
              />
            </>
          )}

          {/* Editable SAML Config */}
          {editForm.type === "saml" && editingProvider?.samlConfig && (
            <>
              <SectionHeader title="SAML Configuration" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="SSO Entry Point">
                  <Input
                    value={editForm.saml.entryPoint}
                    onChange={(v) => updateEditSAMLForm("entryPoint", v)}
                    placeholder="https://idp.company.com/sso"
                  />
                </FormField>
                <FormField label="Callback URL">
                  <Input
                    value={editForm.saml.callbackUrl}
                    onChange={(v) => updateEditSAMLForm("callbackUrl", v)}
                    placeholder="https://yourapp.com/api/auth/sso/saml2/callback/providerId"
                  />
                </FormField>
                <FormField label="Audience">
                  <Input
                    value={editForm.saml.audience || ""}
                    onChange={(v) => updateEditSAMLForm("audience", v)}
                    placeholder="https://yourapp.com"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Signature Algorithm">
                  <Select
                    value={editForm.saml.signatureAlgorithm}
                    onChange={(v) => updateEditSAMLForm("signatureAlgorithm", v)}
                    options={[
                      { value: "rsa-sha256", label: "RSA-SHA256" },
                      { value: "rsa-sha1", label: "RSA-SHA1" },
                      { value: "rsa-sha384", label: "RSA-SHA384" },
                      { value: "rsa-sha512", label: "RSA-SHA512" },
                    ]}
                  />
                </FormField>
                <FormField label="Digest Algorithm">
                  <Select
                    value={editForm.saml.digestAlgorithm}
                    onChange={(v) => updateEditSAMLForm("digestAlgorithm", v)}
                    options={[
                      { value: "sha256", label: "SHA-256" },
                      { value: "sha1", label: "SHA-1" },
                      { value: "sha384", label: "SHA-384" },
                      { value: "sha512", label: "SHA-512" },
                    ]}
                  />
                </FormField>
              </div>
              <div className="flex gap-6">
                <Checkbox
                  checked={editForm.saml.wantAssertionsSigned}
                  onChange={(v) => updateEditSAMLForm("wantAssertionsSigned", v)}
                  label="Require signed assertions"
                />
                <Checkbox
                  checked={editForm.saml.authnRequestsSigned}
                  onChange={(v) => updateEditSAMLForm("authnRequestsSigned", v)}
                  label="Sign authentication requests"
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingProvider(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deletingProvider !== null}
        onClose={() => setDeletingProvider(null)}
        onConfirm={handleDelete}
        title="Delete SSO Provider"
        message={`Are you sure you want to delete "${deletingProvider?.providerId}"? Users with this domain will no longer be able to sign in via SSO. This action cannot be undone.`}
        confirmLabel="Delete Provider"
        isLoading={deleteLoading}
        isDanger
      />

      {/* ─── Detail View Modal ──────────────────────────────────────────────── */}
      <Modal
        open={detailProvider !== null}
        onClose={() => setDetailProvider(null)}
        title={`Provider Details — ${detailProvider?.providerId || ""}`}
      >
        {detailProvider && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-sm text-gray-200 font-medium">{detailProvider.type.toUpperCase()}</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Domain</p>
                <p className="text-sm text-gray-200 font-mono font-medium">{detailProvider.domain}</p>
              </div>
              <div className="col-span-2 bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Issuer</p>
                <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.issuer}</p>
              </div>
              <div className="col-span-2 bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Domain Verification</p>
                <div className="flex items-center gap-2 mt-1">
                  {detailProvider.domainVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SP Metadata */}
            <div>
              <SectionHeader title="Service Provider Metadata" description="SP metadata URL for your IdP configuration" />
              <div className="flex items-center gap-2 bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5">
                <code className="flex-1 text-xs text-gray-300 font-mono truncate">
                  {detailProvider.spMetadataUrl}
                </code>
                <CopyButton text={detailProvider.spMetadataUrl} label="SP Metadata URL" />
              </div>
            </div>

            {/* OIDC Config Details */}
            {detailProvider.type === "oidc" && detailProvider.oidcConfig && (
              <>
                <SectionHeader title="OIDC Configuration" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Discovery Endpoint</p>
                    <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.oidcConfig.discoveryEndpoint}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Client ID</p>
                    <p className="text-sm text-gray-200 font-mono">...{detailProvider.oidcConfig.clientIdLastFour}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">PKCE</p>
                    <p className="text-sm text-gray-200">{detailProvider.oidcConfig.pkce ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Token Auth Method</p>
                    <p className="text-sm text-gray-200 font-mono">{detailProvider.oidcConfig.tokenEndpointAuthentication || "N/A"}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Scopes</p>
                    <p className="text-sm text-gray-200">{detailProvider.oidcConfig.scopes?.join(", ") || "N/A"}</p>
                  </div>
                  {detailProvider.oidcConfig.authorizationEndpoint && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Authorization Endpoint</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.oidcConfig.authorizationEndpoint}</p>
                    </div>
                  )}
                  {detailProvider.oidcConfig.tokenEndpoint && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Token Endpoint</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.oidcConfig.tokenEndpoint}</p>
                    </div>
                  )}
                  {detailProvider.oidcConfig.userInfoEndpoint && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">UserInfo Endpoint</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.oidcConfig.userInfoEndpoint}</p>
                    </div>
                  )}
                  {detailProvider.oidcConfig.jwksEndpoint && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">JWKS Endpoint</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.oidcConfig.jwksEndpoint}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SAML Config Details */}
            {detailProvider.type === "saml" && detailProvider.samlConfig && (
              <>
                <SectionHeader title="SAML Configuration" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">SSO Entry Point</p>
                    <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.samlConfig.entryPoint}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Callback URL</p>
                    <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.samlConfig.callbackUrl}</p>
                  </div>
                  {detailProvider.samlConfig.audience && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Audience</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{detailProvider.samlConfig.audience}</p>
                    </div>
                  )}
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Signature Algorithm</p>
                    <p className="text-sm text-gray-200 font-mono">{detailProvider.samlConfig.signatureAlgorithm || "N/A"}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Digest Algorithm</p>
                    <p className="text-sm text-gray-200 font-mono">{detailProvider.samlConfig.digestAlgorithm || "N/A"}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Signed Assertions</p>
                    <p className="text-sm text-gray-200">{detailProvider.samlConfig.wantAssertionsSigned ? "Required" : "Not Required"}</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Signed Requests</p>
                    <p className="text-sm text-gray-200">{detailProvider.samlConfig.authnRequestsSigned ? "Enabled" : "Disabled"}</p>
                  </div>
                  {detailProvider.samlConfig.certificate && !detailProvider.samlConfig.certificate.error && (
                    <>
                      <div className="bg-[#0d0d0d] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Cert Fingerprint (SHA-256)</p>
                        <p className="text-sm text-gray-200 font-mono text-xs break-all">{detailProvider.samlConfig.certificate.fingerprintSha256 || "N/A"}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Public Key Algorithm</p>
                        <p className="text-sm text-gray-200 font-mono">{detailProvider.samlConfig.certificate.publicKeyAlgorithm || "N/A"}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Valid From</p>
                        <p className="text-sm text-gray-200">{detailProvider.samlConfig.certificate.notBefore ? new Date(detailProvider.samlConfig.certificate.notBefore).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                        <p className="text-sm text-gray-200">{detailProvider.samlConfig.certificate.notAfter ? new Date(detailProvider.samlConfig.certificate.notAfter).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </>
                  )}
                  {detailProvider.samlConfig.certificate?.error && (
                    <div className="bg-[#0d0d0d] rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Certificate</p>
                      <p className="text-sm text-red-400">{detailProvider.samlConfig.certificate.error}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
