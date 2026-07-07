import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EmployeeAvatarProps {
  initials: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function EmployeeAvatar({ initials, size = "default", className }: EmployeeAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
