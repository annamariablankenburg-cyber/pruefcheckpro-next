interface MeasurementValidationMessageProps {
  message?: string;
}

export function MeasurementValidationMessage({ message }: MeasurementValidationMessageProps) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}
