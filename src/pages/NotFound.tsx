import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/50">
      <div className="text-center p-8 rounded-lg glassmorphism max-w-md w-full">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! The page you're looking for doesn't exist.</p>
        <Button variant="default" asChild>
          <Link to="/" className="flex items-center justify-center">
            <MoveLeft className="h-4 w-4 mr-2" /> Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
