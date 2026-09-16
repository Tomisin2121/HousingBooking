import React from 'react';

export function Input({
  label, error, icon: Icon, className = '', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; icon?: React.ElementType }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-ink mb-1">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`w-full border border-line rounded-lg px-3 py-2 text-sm text-ink
            placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            ${Icon ? 'pl-9' : ''} ${error ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function Select({
  label, options, value, onChange, className = '', ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-ink mb-1">{label}</label>}
      <select
        className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        value={value}
        onChange={onChange}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }: {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
  className?: string;
}) {
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({ src, name, size = 'md', className = '' }: {
  src?: string; name: string; size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />
  ) : (
    <div className={`rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}

export function Card({ children, className = '', onClick, active }: {
  children: React.ReactNode; className?: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-xl bg-white transition-all ${
        active ? 'border-primary ring-2 ring-primary/10' : 'border-line'
      } ${onClick ? 'cursor-pointer hover:border-primary/50' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}