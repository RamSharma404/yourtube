import React, { useState } from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

const tabs = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
];

const Channeltabs = () => {
  const [activeTab, setActiveTab] = useState("videos");
  return (
    <div className="mt-8 border-b border-border px-4 md:px-12 bg-background sticky top-14 z-10">
      <div className="flex gap-2 overflow-x-auto no-scrollbar relative">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative">
            <Button
              variant="ghost"
              className={`px-6 py-6 text-sm md:text-base font-semibold rounded-none bg-transparent hover:bg-secondary/40 transition-colors ${
                activeTab === tab.id 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-foreground rounded-t-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Channeltabs;
