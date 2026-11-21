import { Plus, ShoppingCart } from 'lucide-react';

export function CartPlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <ShoppingCart className="h-full w-full" strokeWidth={2} />
      <Plus
        className="bg-primary text-primary-fg border-border-strong absolute -top-1.5 -right-1.5 h-3.5 w-3.5 border p-0.5"
        strokeWidth={3}
      />
    </span>
  );
}
