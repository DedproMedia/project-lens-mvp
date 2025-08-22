"use client";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function AddProjectButton() {
  const router = useRouter();
  const go = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    router.push("/projects/new");
  };
  return (
    <button
      type="button"
      onClick={go}
      className="rounded-md px-3 py-2 text-sm font-medium border"
    >
      New Project
    </button>
  );
}
