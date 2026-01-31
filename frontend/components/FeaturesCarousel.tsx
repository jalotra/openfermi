"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { PenTool, Users, Clock, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: PenTool,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Interactive Drawing",
    description:
      "Draw solutions, annotate problems, and express your ideas with our powerful canvas powered by TLDRAW.",
  },
  {
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Real-time Collaboration",
    description:
      "Work together with peers and instructors. Chat, share audio, and collaborate seamlessly.",
  },
  {
    icon: Clock,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Session Timer",
    description:
      "Track your study sessions with our built-in timer. Stay focused and manage your time effectively.",
  },
  {
    icon: FileText,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Export & Save",
    description:
      "Export your work as PDF, save your progress, and never lose your solutions.",
  },
];

export function FeaturesCarousel() {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-12">
      <Carousel opts={{ loop: true, align: "start" }}>
        <CarouselContent className="items-stretch pb-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <CarouselItem
                key={feature.title}
                className="pl-4 basis-full md:basis-1/2 flex"
              >
                <Card className="p-6 flex-1 hover:shadow-lg transition-shadow">
                  <div
                    className={`h-12 w-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
