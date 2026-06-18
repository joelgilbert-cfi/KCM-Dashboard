'use client';

import { useEffect, useState } from 'react';
import type { FormatOptionLabelMeta, MultiValue, StylesConfig } from 'react-select';
import CreatableSelect from 'react-select/creatable';

export interface EmailOption {
  label: string;
  value: string;
  name: string;
  email: string;
  source?: 'user' | 'contact' | 'custom';
}

interface EmailRecipientSelectProps {
  value: EmailOption[];
  onChange: (value: EmailOption[]) => void;
  placeholder?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => emailPattern.test(value.trim());

const initialsFor = (name?: string) => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const toCustomOption = (email: string): EmailOption => ({
  label: email,
  value: email,
  name: email,
  email,
  source: 'custom',
});

const normalizeOption = (option: Partial<EmailOption>): EmailOption => {
  const email = String(option.email || option.value || option.label || '').trim();
  const name = String(option.name || option.label || email).trim();

  return {
    label: option.label || (name && name !== email ? `${name} <${email}>` : email),
    value: option.value || email,
    name: name || email,
    email,
    source: option.source || 'custom',
  };
};

export function EmailRecipientSelect({
  value,
  onChange,
  placeholder = 'Type a name or email...',
}: EmailRecipientSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<EmailOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/email-contacts?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setOptions([]);
          return;
        }
        const data = (await response.json()) as { contacts?: Partial<EmailOption>[] };
        setOptions((data.contacts ?? []).map(normalizeOption).filter((contact) => contact.email));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [inputValue]);

  const normalizedValue = value.map(normalizeOption).filter((option) => option.email);
  const selectedEmails = new Set(normalizedValue.map((option) => option.email.toLowerCase()));
  const filteredOptions = options.filter((option) => !selectedEmails.has(option.email.toLowerCase()));

  const styles: StylesConfig<EmailOption, true> = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--color-card)',
      borderColor: 'var(--color-border)',
      borderRadius: 'var(--radius-md)',
      minHeight: '2.5rem',
      fontSize: '0.875rem',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      zIndex: 70,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--color-accent)' : 'transparent',
      color: 'var(--color-foreground)',
      cursor: 'pointer',
      padding: 0,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--color-secondary)',
      borderRadius: '999px',
      margin: '0.125rem',
      maxWidth: '15rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--color-foreground)',
      fontSize: '0.8125rem',
      padding: '0.1875rem 0.25rem 0.1875rem 0.5rem',
    }),
    input: (base) => ({
      ...base,
      color: 'var(--color-foreground)',
    }),
  };

  const formatOptionLabel = (option: EmailOption, meta: FormatOptionLabelMeta<EmailOption>) => {
    const normalizedOption = normalizeOption(option);

    if (meta.context === 'value') {
      return (
        <span className="block max-w-[12rem] truncate text-[13px] leading-5">
          {normalizedOption.name && normalizedOption.name !== normalizedOption.email
            ? normalizedOption.name
            : normalizedOption.email}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {initialsFor(normalizedOption.name)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{normalizedOption.name}</div>
          <div className="truncate text-xs text-muted-foreground">{normalizedOption.email}</div>
        </div>
        {normalizedOption.source && normalizedOption.source !== 'custom' && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {normalizedOption.source === 'user' ? 'User' : 'Contact'}
          </span>
        )}
      </div>
    );
  };

  return (
    <CreatableSelect
      isMulti
      value={normalizedValue}
      options={filteredOptions}
      inputValue={inputValue}
      onInputChange={(newValue, meta) => {
        if (meta.action !== 'input-change') return;
        setInputValue(newValue);
        if (!newValue.trim()) {
          setOptions([]);
          setLoading(false);
        }
      }}
      onChange={(newValue) => {
        onChange([...(newValue as MultiValue<Partial<EmailOption>>)].map(normalizeOption));
      }}
      onCreateOption={(email) => {
        const trimmed = email.trim();
        if (!isValidEmail(trimmed)) return;
        onChange([...value, toCustomOption(trimmed)]);
        setInputValue('');
      }}
      isValidNewOption={(input) => isValidEmail(input)}
      formatCreateLabel={(input) => `Add ${input.trim()}`}
      placeholder={placeholder}
      styles={styles}
      menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
      menuPosition="fixed"
      isLoading={loading}
      noOptionsMessage={() =>
        inputValue.trim() ? 'No matching contacts. Type a valid email to add it.' : 'Start typing a name or email.'
      }
      formatOptionLabel={formatOptionLabel}
    />
  );
}
