/**
 * ─── Dynamic Settings Form ──────────────────────────────────────────────────
 *
 * Renders a form dynamically from a JSON Schema object.
 * Used by the admin plugin settings page to let users configure plugins.
 *
 * Supports field types: string, number, boolean, enum (via string with enum[]),
 * and object (nested).
 *
 * Usage:
 *   <DynamicForm
 *     schema={plugin.manifest.settingsSchema}
 *     values={currentSettings}
 *     onChange={setSettings}
 *   />
 */

"use client";

import { useState, useEffect } from "react";

interface FormFieldProps {
  name: string;
  schema: any;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  path?: string;
}

function FormField({ name, schema, value, onChange, path = "" }: FormFieldProps) {
  const fullPath = path ? `${path}.${name}` : name;
  const displayName = schema.title ?? name;
  const description = schema.description ?? "";
  const isRequired = schema.required?.includes(name) ?? false;

  // Nested object
  if (schema.type === "object" && schema.properties) {
    return (
      <fieldset className="border border-white/10 rounded-lg p-4 space-y-3">
        <legend className="text-sm font-medium text-gray-300 px-2">{displayName}</legend>
        {description && <p className="text-xs text-gray-600 -mt-1 mb-2">{description}</p>}
        {Object.entries(schema.properties).map(([key, propSchema]: [string, any]) => (
          <FormField
            key={key}
            name={key}
            schema={propSchema}
            value={(value as Record<string, unknown>)?.[key]}
            onChange={(n, v) => {
              const updated = { ...(value as Record<string, unknown>) ?? {} } as Record<string, unknown>;
              updated[n] = v;
              onChange(fullPath, updated);
            }}
            path={fullPath}
          />
        ))}
      </fieldset>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-gray-400">
        {displayName}
        {isRequired && <span className="text-red-400 ml-1">*</span>}
      </label>
      {description && <p className="text-xs text-gray-600">{description}</p>}
      <FormInput
        name={name}
        schema={schema}
        value={value}
        onChange={(v) => onChange(fullPath, v)}
      />
    </div>
  );
}

function FormInput({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: any;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputClass =
    "w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200";

  // Enum (select)
  if (schema.enum) {
    return (
      <select
        value={String(value ?? schema.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">Select...</option>
        {schema.enum.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  // Boolean (toggle)
  if (schema.type === "boolean") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
          value ? "bg-violet-500" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  // Number
  if (schema.type === "number" || schema.type === "integer") {
    return (
      <input
        type="number"
        value={String(value ?? schema.default ?? "")}
        onChange={(e) => onChange(schema.type === "integer" ? parseInt(e.target.value) : parseFloat(e.target.value))}
        placeholder={schema.default !== undefined ? String(schema.default) : ""}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.type === "integer" ? 1 : "any"}
        className={inputClass}
      />
    );
  }

  // String (text or textarea)
  if ((schema.maxLength ?? 0) > 100) {
    return (
      <textarea
        value={String(value ?? schema.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.default !== undefined ? String(schema.default) : ""}
        rows={3}
        className={inputClass + " resize-y"}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? schema.default ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={schema.default !== undefined ? String(schema.default) : ""}
      className={inputClass}
    />
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export interface DynamicFormProps {
  schema: Record<string, unknown> | undefined;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export function DynamicForm({ schema, values, onChange }: DynamicFormProps) {
  if (!schema || !schema.properties) {
    return <p className="text-sm text-gray-600">No configuration options available.</p>;
  }

  const properties = schema.properties as Record<string, any>;
  const required = (schema.required as string[]) ?? [];

  // Map nested paths to flat updates
  const handleFieldChange = (path: string, val: unknown) => {
    const parts = path.split(".");
    if (parts.length === 1) {
      onChange({ ...values, [path]: val });
    } else {
      // Nested path: set value at deep path
      const newValues = { ...values };
      let current: any = newValues;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        if (typeof current[parts[i]] === "object") {
          current[parts[i]] = { ...current[parts[i]] };
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = val;
      onChange(newValues);
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, propSchema]: [string, any]) => (
        <FormField
          key={key}
          name={key}
          schema={{ ...propSchema, required }}
          value={(values as Record<string, unknown>)[key]}
          onChange={handleFieldChange}
        />
      ))}
    </div>
  );
}
