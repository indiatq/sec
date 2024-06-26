"use client";

import * as z from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";

import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";
import { ChangeEvent, useState } from "react";
import { UserValidation } from "@/lib/validations/user";
import { updateUser } from "@/lib/actions/user.actions";



interface Props {
  
  userId: string;
}

function PostThread({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");

  const [files, setFiles] = useState<File[]>([]);

  const { organization } = useOrganization();

  const form = useForm<z.infer<typeof ThreadValidation>>({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
      content_photo: "", // Add this line
    },
  });

    const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
      console.log("reached submit ");
      console.log("Orgnisation  ",organization);

      let imageUrl = ""; // Initialize imageUrl
      
      if (values.content_photo) {
        const blob = values.content_photo;

          const hasImageChanged = isBase64Image(blob);
          if (hasImageChanged) {
            const imgRes = await startUpload(files);

            if (imgRes && imgRes[0].fileUrl) {
              values.content_photo = imgRes[0].fileUrl;
              console.log("URL uploaded: ",values.content_photo);
            }
          }
      
        }
        console.log("Ready to upload  ");    
    await createThread({
      text: values.thread,
      author: userId,
      communityId: organization ? organization.id : null,
      fileUrl: values.content_photo,
      path: pathname,
    });

    router.push("/");
  };
  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        
        fieldChange(imageDataUrl);
        

      };

      fileReader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form
        className='mt-10 flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name='thread'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
                <Textarea rows={15} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='content_photo'
          render={({ field }) => (
            <FormItem className='flex items-center gap-4'>
              
              <FormControl className='flex-1 text-base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add content image'
                  className='account-form_image-input'
                  onChange={(e) => handleImage(e, field.onChange)}
                  required={false} // Make the file input field optional
                />
              </FormControl>
            </FormItem>
          )}
        />


        <Button type='submit' className='bg-primary-500'>
          Post Thread
        </Button>
      </form>
    </Form>
  );
}

export default PostThread;
