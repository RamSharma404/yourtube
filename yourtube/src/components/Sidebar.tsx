import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  Download,
  User,
  Phone,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

const Sidebar = () => {
  const { user } = useUser();

  const [isdialogeopen, setisdialogeopen] = useState(false);
  return (
    <aside className="w-64 shrink-0 bg-white text-neutral-950 border-r border-gray-200 min-h-screen p-2">
      <nav className="space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className="w-full justify-start text-neutral-500 disabled:opacity-70" disabled>
            <Compass className="w-5 h-5 mr-3" />
            Explore Soon
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className="w-full justify-start text-neutral-500 disabled:opacity-70" disabled>
            <PlaySquare className="w-5 h-5 mr-3" />
            Subscriptions Soon
          </Button>
        </Link>
        <Link href="/call">
          <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
            <Phone className="w-5 h-5 mr-3" />
            Video Call
          </Button>
        </Link>

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <Link href="/history">
                <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
                  <History className="w-5 h-5 mr-3" />
                  History
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
                  <ThumbsUp className="w-5 h-5 mr-3" />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
                  <Clock className="w-5 h-5 mr-3" />
                  Watch later
                </Button>
              </Link>
              <Link href="/downloads">
                <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
                  <Download className="w-5 h-5 mr-3" />
                  Downloads
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user._id}`}>
                  <Button variant="ghost" className="w-full justify-start text-neutral-950 hover:bg-gray-100 hover:text-neutral-950">
                    <User className="w-5 h-5 mr-3" />
                    Your channel
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
