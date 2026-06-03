import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-950 via-background to-fuchsia-950 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30 mb-6">
        <Zap className="h-8 w-8" />
      </div>
      <h1 className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
        404
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">Página não encontrada</p>
      <p className="mt-1 text-sm text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
