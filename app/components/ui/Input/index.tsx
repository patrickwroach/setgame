'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        className={`input ${className}`}
        {...props}
      />
    </div>
  );
}
