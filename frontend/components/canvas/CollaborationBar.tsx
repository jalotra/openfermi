"use client";

import { Menu, Mic, MicOff, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CollaborationBarProps {
  onMenuClick?: () => void;
  onMicToggle?: (muted: boolean) => void;
  onChatClick?: () => void;
  onSpeakerClick?: () => void;
}

export function CollaborationBar({
  onMenuClick,
  onMicToggle,
  onChatClick,
  onSpeakerClick,
}: CollaborationBarProps) {
  const [isMuted, setIsMuted] = useState(true);

  const handleMicToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMicToggle?.(newMutedState);
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 bg-white rounded-full shadow-lg p-2 border border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10 rounded-full"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="h-px bg-gray-200 my-1" />
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">U</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSpeakerClick}
          className="h-10 w-10 rounded-full"
        >
          <Users className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onChatClick}
          className="h-10 w-10 rounded-full"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMicToggle}
          className={cn(
            "h-10 w-10 rounded-full",
            isMuted && "bg-red-50 hover:bg-red-100",
          )}
        >
          {isMuted ? (
            <MicOff className="h-5 w-5 text-red-600" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
