import React from "react";

type ActionProps =
  | { label: string; onClick: () => void; href?: never }
  | { label: string; href: string; onClick?: never };

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: ActionProps;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 flex items-center justify-center text-gray-300 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
