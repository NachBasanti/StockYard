import { useState } from 'react';

export const useForm = <T extends Record<string, any>>() => {
  const [values, setValues] = useState<T>({} as T);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = (name: keyof T, validation: { required?: boolean | string } = {}) => ({
    name,
    id: name as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'file' 
        ? Array.from((e.target as HTMLInputElement).files || []).map(file => URL.createObjectURL(file))
        : e.target.value;
      
      setValues(prev => ({ ...prev, [name]: value }));
      
      if (validation.required && !value) {
        setErrors(prev => ({ ...prev, [name]: `${validation.required === true ? 'This field is required' : validation.required}` }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    },
    value: values[name] || ''
  });

  const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    let hasErrors = false;
    
    Object.keys(values).forEach(key => {
      if (!values[key as keyof T]) {
        setErrors(prev => ({ ...prev, [key]: 'This field is required' }));
        hasErrors = true;
      }
    });
    
    if (!hasErrors) {
      onSubmit(values);
    }
  };

  return {
    register,
    handleSubmit,
    formState: { errors },
    setValue: (name: keyof T, value: any) => setValues(prev => ({ ...prev, [name]: value })),
    reset: () => {
      setValues({} as T);
      setErrors({});
    }
  };
};