"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  StopCircle,
  DollarSign,
} from "lucide-react";
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
import type { AgentSessionDto } from "@/lib/backend/types.gen";
import { parseDate } from "@/lib/utils";

function stateVariant(
  state?: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (state) {
    case "RUNNING":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "STARTING":
      return "outline";
    case "FAILED":
    case "TERMINATED":
      return "destructive";
    default:
      return "outline";
  }
}

export const columns: ColumnDef<AgentSessionDto>[] = [
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const state = row.getValue("state") as string;
      return <Badge variant={stateVariant(state)}>{state}</Badge>;
    },
  },
  {
    accessorKey: "tokenUsage",
    header: "Tokens",
    cell: ({ row }) => {
      const tokens = row.getValue("tokenUsage") as number | undefined;
      return tokens != null ? tokens.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: ({ row }) => {
      const cost = row.getValue("cost") as number | undefined;
      return cost != null ? (
        <span className="flex items-center gap-1 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {cost.toFixed(4)}
        </span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const parsed = parseDate(row.getValue("createdAt") as string | number[]);
      return parsed ? (
        <span className="text-sm">
          {parsed.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const session = row.original;
      const isActive =
        session.state === "RUNNING" || session.state === "STARTING";

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
              <Link href={`/agent-sessions/${session.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                {isActive ? "Live View" : "View Details"}
              </Link>
            </DropdownMenuItem>
            {isActive && (
              <DropdownMenuItem className="text-destructive">
                <StopCircle className="mr-2 h-4 w-4" />
                Terminate
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
