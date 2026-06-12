'use client';

import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';

interface EmailOption {
  label: string;
  value: string;
}

interface EmailTagInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  id?: string;
}

export default function EmailTagInput({
  value,
  onChange,
  placeholder = 'Type email or select...',
  id,
}: EmailTagInputProps) {
  const [userOptions, setUserOptions] = useState<EmailOption[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase.from('users').select('name, email');
      if (data) {
        setUserOptions(
          data.map((u: Pick<User, 'name' | 'email'>) => ({
            label: `${u.name} <${u.email}>`,
            value: u.email,
          }))
        );
      }
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedValues: EmailOption[] = value.map((email) => ({
    label: userOptions.find((o) => o.value === email)?.label || email,
    value: email,
  }));

  return (
    <CreatableSelect
      id={id}
      isMulti
      value={selectedValues}
      onChange={(newValue) =>
        onChange(newValue ? newValue.map((v) => v.value) : [])
      }
      options={userOptions}
      placeholder={placeholder}
      className="react-select-container"
      classNamePrefix="react-select"
      formatCreateLabel={(input) => `Add "${input}"`}
      noOptionsMessage={() => 'Type an email address...'}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '42px',
        }),
      }}
    />
  );
}
