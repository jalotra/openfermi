"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QuestionDto } from "@/lib/backend";
import { LatexRenderer } from "@/components/ui/latex-renderer";

export const columns: ColumnDef<QuestionDto>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "latexQuestionText",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Question
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => {
      const subject = row.getValue("subject") as string;
      return subject ? (
        <Badge variant="outline">{subject}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    filterFn: "equals",
  },
  {
    accessorKey: "examType",
    header: "Exam",
    cell: ({ row }) => {
      const examType = row.getValue("examType") as string;
      const displayMap: Record<string, string> = {
        JEE_ADVANCED: "JEE Advanced",
        JEE_MAIN: "JEE Main",
        NEET: "NEET",
      };
      return examType ? (
        <Badge variant="outline">{displayMap[examType] || examType}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    filterFn: "equals",
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => {
      const year = row.getValue("year") as number;
      return year || <span className="text-muted-foreground">-</span>;
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      return String(row.getValue(columnId)) === String(filterValue);
    },
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty") as string;
      const displayMap: Record<string, string> = {
        EASY: "Easy",
        MEDIUM: "Medium",
        HARD: "Hard",
      };
      const display = displayMap[difficulty] || difficulty;
      return (
        <Badge
          variant="secondary"
          className={
            difficulty === "EASY"
              ? "bg-green-100 text-green-700"
              : difficulty === "MEDIUM"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }
        >
          {display}
        </Badge>
      );
    },
    filterFn: "equals",
  },
];

export const cellRenderers: Record<
  string,
  React.ComponentType<{ value: unknown }>
> = {
  latexQuestionText: ({ value }) => {
    const text = value as string;
    if (!text) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="max-w-md">
        <LatexRenderer
          content={text.substring(0, 100) + (text.length > 100 ? "..." : "")}
        />
      </div>
    );
  },
};
