import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { Pencil } from "lucide-react";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const isOwner = user && user?._id === channel?._id;

  return (
    <div className="w-full bg-background">
      {/* Dynamic Animated Banner */}
      <div className="relative h-40 md:h-56 lg:h-72 overflow-hidden rounded-b-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 animate-gradient-xy"></div>
        {/* Subtle overlay pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      {/* Channel Info with Glassmorphism Float */}
      <div className="px-4 md:px-12 py-2">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative -mt-16 md:-mt-20">
          
          {/* Avatar Container */}
          <div className="relative p-2 bg-background/80 backdrop-blur-xl rounded-full shadow-2xl ring-1 ring-border/50">
            <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-inner">
              <AvatarImage src={channel?.image} alt={channel?.channelname} className="object-cover" />
              <AvatarFallback className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-gray-800 to-gray-900 text-transparent bg-clip-text">
                {channel?.channelname?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            {/* Online Indicator Dot */}
            <div className="absolute bottom-4 right-4 w-5 h-5 bg-green-500 border-4 border-background rounded-full animate-pulse"></div>
          </div>

          <div className="flex-1 space-y-3 mt-4 md:mt-24 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground drop-shadow-sm">
              {channel?.channelname || "Loading..."}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm md:text-base text-muted-foreground font-medium">
              <span className="bg-secondary/50 px-3 py-1 rounded-full border border-border">
                @{channel?.channelname?.toLowerCase().replace(/\s+/g, "") || "user"}
              </span>
              <span className="px-3 py-1">&bull; 0 Subscribers</span>
              <span className="px-3 py-1">&bull; 0 Videos</span>
            </div>
            {channel?.description && (
              <p className="text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed mt-2">
                {channel?.description}
              </p>
            )}
          </div>

          <div className="mt-4 md:mt-24 w-full md:w-auto flex justify-center md:justify-end gap-3">
            {isOwner ? (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="px-6 py-6 rounded-full font-bold transition-all shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-1 ring-border flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit Channel
              </Button>
            ) : (
              user && (
                <Button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`px-8 py-6 rounded-full font-bold transition-all duration-300 shadow-lg transform hover:scale-105 ${
                    isSubscribed 
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-1 ring-border" 
                      : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-none shadow-red-500/25"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
      
      <Channeldialogue 
        isopen={isEditModalOpen} 
        onclose={() => setIsEditModalOpen(false)} 
        channeldata={channel} 
        mode="edit" 
      />
    </div>
  );
};

export default ChannelHeader;
