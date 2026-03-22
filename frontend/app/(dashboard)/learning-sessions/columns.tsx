"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { parseDate } from "@/lib/utils";

export interface LearningSessionRow {
  id: string;
  questionId: string;
  tutorId: string;
  tutorName?: string;
  userId: string;
  audioUrl: string;
  createdAt?: string;
}

export const columns: ColumnDef<LearningSessionRow>[] = [
  {
    accessorKey: "tutorName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Tutor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("tutorName") as string;
      return name || <span className="text-muted-foreground">Unknown</span>;
    },
  },
  {
    accessorKey: "userId",
    header: "User",
    cell: ({ row }) => {
      const userId = row.getValue("userId") as string;
      return (
        <Badge variant="outline" className="text-xs">
          {userId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "audioUrl",
    header: "Audio",
    cell: ({ row }) => {
      const url = row.getValue("audioUrl") as string;
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-xs inline-flex items-center gap-1"
        >
          Listen <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
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
    header: "",
    cell: ({ row }) => (
      <Link href={`/learn/${row.original.id}`}>
        <Button size="sm" variant="outline">
          Open
        </Button>
      </Link>
    ),
  },
];
