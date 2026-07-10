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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}

const NavItem = ({ href, icon: Icon, label, disabled = false }: NavItemProps) => {
  const router = useRouter();
  const active = router.pathname === href;

  const button = (
    <Button
      variant="ghost"
      disabled={disabled}
      className={`w-full justify-start gap-3 rounded-xl ${
        active
          ? "bg-accent font-semibold text-accent-foreground"
          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Button>
  );

  if (disabled) {
    return <div className="cursor-not-allowed opacity-50">{button}</div>;
  }

  return <Link href={href}>{button}</Link>;
};

const Sidebar = () => {
  const { user } = useUser();
  const [isdialogeopen, setisdialogeopen] = useState(false);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-background p-3 md:block">
      <nav className="space-y-1">
        <NavItem href="/" icon={Home} label="Home" />
        <NavItem href="/explore" icon={Compass} label="Explore" />
        <NavItem href="/subscriptions" icon={PlaySquare} label="Subscriptions" />
        <NavItem href="/call" icon={Phone} label="Video Call" />

        {user && (
          <div className="mt-3 space-y-1 border-t border-border pt-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              You
            </p>
            <NavItem href="/history" icon={History} label="History" />
            <NavItem href="/liked" icon={ThumbsUp} label="Liked videos" />
            <NavItem href="/watch-later" icon={Clock} label="Watch later" />
            <NavItem href="/downloads" icon={Download} label="Downloads" />
            {user?.channelname ? (
              <NavItem href={`/channel/${user._id}`} icon={User} label="Your channel" />
            ) : (
              <div className="px-2 pt-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => setisdialogeopen(true)}
                >
                  Create Channel
                </Button>
              </div>
            )}
          </div>
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
