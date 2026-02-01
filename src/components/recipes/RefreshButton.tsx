import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onClick: () => void;
  loading: boolean;
}

export const RefreshButton = ({ onClick, loading }: RefreshButtonProps) => (
  <Button variant="outline" onClick={onClick} disabled={loading} aria-busy={loading}>
    {loading ? "Refreshing..." : "Refresh"}
  </Button>
);
