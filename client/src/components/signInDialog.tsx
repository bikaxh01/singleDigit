"use client";
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import axios from "axios";
import { SERVER_URL } from "@/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function SignInDialog({ open }: { open: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  console.log("🚀 ~ handelSignIn ~ SERVER_URL:", SERVER_URL);
  const handelSignIn = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${SERVER_URL}/sign-in`);
      router.replace(res.data.redirect_url);
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <Button disabled={isLoading} onClick={handelSignIn}>
          Sign-in with Google{" "}
          {isLoading && <Loader2 className=" animate-spin size-4" />}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
