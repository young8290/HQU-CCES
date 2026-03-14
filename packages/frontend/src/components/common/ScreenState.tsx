interface ScreenStateProps {
  label: string;
  fullScreen?: boolean;
}

export default function ScreenState({
  label,
  fullScreen = false,
}: ScreenStateProps) {
  return (
    <div
      className={
        fullScreen
          ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950'
          : 'flex items-center justify-center h-64'
      }
    >
      <div className="text-sm text-neutral-400 dark:text-neutral-500">
        {label}
      </div>
    </div>
  );
}
