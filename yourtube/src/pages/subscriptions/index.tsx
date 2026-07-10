import React from "react";
import { PlaySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SubscriptionsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <PlaySquare className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Your Subscriptions</h1>
      <p className="text-muted-foreground max-w-md text-lg mb-8">
        This is where videos from all the channels you subscribe to will appear! We are actively building this feature.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8">
          Discover new channels
        </Button>
      </Link>
    </div>
  );
}
