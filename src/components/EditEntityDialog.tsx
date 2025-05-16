"use client";
import React, { Suspense } from "react";
import { Spinner } from "@/components/Spinner";

interface EditEntityDialogProps<T extends Record<string, unknown>> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: T) => void;
  initialData?: T;
  title: string;
  children: React.ReactNode;
}

export function EditEntityDialog<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  children,
}: EditEntityDialogProps<T>) {
  const handleSubmit = async (data: T) => {
    if (onSubmit) {
      await onSubmit(data);
    }
    onClose();
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
