import { Button } from "./ui/button";

export default function RefreshButton() {
  return (
    <div>
      <Button onClick={() => window.location.reload()}>Refresh</Button>
    </div>
  );
}
