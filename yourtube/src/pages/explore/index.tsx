import React from "react";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Compass className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Trending & Explore</h1>
      <p className="text-muted-foreground max-w-md text-lg">
        This feature is currently under active development! Soon, you will be able to discover trending videos across the platform right here.
      </p>
    </div>
  );
}
