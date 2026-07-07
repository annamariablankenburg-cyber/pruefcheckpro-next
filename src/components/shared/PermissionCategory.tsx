"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { PermissionSwitch } from "@/components/shared/PermissionSwitch";
import { cn } from "@/lib/utils";
import type { Permission, PermissionCategoryDef } from "@/types/role";

interface PermissionCategoryProps {
  category: PermissionCategoryDef;
  permissions: Permission[];
  values: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function PermissionCategory({
  category,
  permissions,
  values,
  onToggle,
  disabled,
  defaultOpen = true,
}: PermissionCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const grantedCount = permissions.filter((permission) => values[permission.key]).length;

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <category.icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{category.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {grantedCount}/{permissions.length}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-border border-t border-border px-4">
          {permissions.map((permission) => (
            <PermissionSwitch
              key={permission.key}
              label={permission.label}
              checked={values[permission.key] ?? false}
              onCheckedChange={(checked) => onToggle(permission.key, checked)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
