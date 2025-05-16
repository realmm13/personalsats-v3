"use client";
import React, { useEffect } from "react";
import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from "@/components/FormFieldWrapper";
import {
  UploadThingUploadSingleImage,
  type InitialImageType,
} from "@/components/core/UploadThingUploadSingleImage/UploadThingUploadSingleImage";
import { type FieldValues, type FieldPath, useFormContext } from "react-hook-form";
import type { OurFileRouter } from "@/server/uploadthing/core";

export interface FormFieldUploadThingImageProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldWrapperProps<TFieldValues, TName>, "children"> {
  endpoint: keyof OurFileRouter;
}

export function FormFieldUploadThingImage<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ endpoint, ...wrapperProps }: FormFieldUploadThingImageProps<TFieldValues, TName>) {
  return (
    <FormFieldWrapper<TFieldValues, TName> {...wrapperProps}>
      {(field) => {
        const { setValue, trigger } = useFormContext<TFieldValues>();
        const currentImage = field.value as InitialImageType | null | undefined;

        const handleImageChange = (image: InitialImageType | null) => {
          setValue(field.name as TName, image as FieldValues[keyof FieldValues], { shouldDirty: true });
          trigger(field.name as TName);
        };

        return (
          <UploadThingUploadSingleImage
            endpoint={endpoint}
            initialImage={currentImage}
            onImageChange={handleImageChange}
          />
        );
      }}
    </FormFieldWrapper>
  );
}
