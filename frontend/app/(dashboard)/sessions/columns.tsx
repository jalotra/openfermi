"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { SessionDto } from "@/lib/backend/types.gen";

function formatTimeLeft(seconds?: number) {
  if (seconds == null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export const columns: ColumnDef<SessionDto>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <span className="font-mono text-xs">{id?.slice(0, 8)}...</span>;
    },
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const state = row.getValue("state") as string;
      const variant =
        state === "LIVE"
          ? "default"
          : state === "PAUSED" || state === "ENDED"
            ? "secondary"
            : "outline";
      return <Badge variant={variant}>{state}</Badge>;
    },
  },
  {
    accessorKey: "totalQuestions",
    header: "Questions",
  },
  {
    accessorKey: "timeLeftSeconds",
    header: "Time Left",
    cell: ({ row }) => {
      const timeLeft = row.getValue("timeLeftSeconds") as number | undefined;
      return (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatTimeLeft(timeLeft)}
        </span>
      );
    },
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.getValue("score") as number;
      return score ? `${score.toFixed(1)}%` : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const session = row.original;
      const isEnded = session.state === "ENDED";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/sessions/${session.id}`}>
                <Play className="mr-2 h-4 w-4" />
                {isEnded ? "View" : "Continue"}
              </Link>
            </DropdownMenuItem>
            {session.state === "ENDED" && (
              <DropdownMenuItem asChild>
                <Link href={`/sessions/${session.id}/results`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Results
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(session.id || "")}
            >
              Copy Session ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
