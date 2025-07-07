import { cn } from "@/lib/utils";

interface WorkflowGuardLogoProps {
  className?: string;
  showText?: boolean;
}

const WorkflowGuardLogo = ({
  className,
  showText = true,
}: WorkflowGuardLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Ffae26f580f3f4b359fc5216711c44c53%2F45cc30db991744b88b923c4553fba4a8?format=webp&width=800"
          alt="WorkflowGuard Logo"
          className="w-8 h-8 rounded-lg"
        />
      </div>
      {showText && (
        <span className="text-xl font-semibold text-gray-900">
          WorkflowGuard
        </span>
      )}
    </div>
  );
};

export default WorkflowGuardLogo;
