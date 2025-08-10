"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import axios from "axios";
import { SERVER_URL } from "@/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function AddLinkDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const router = useRouter();
  

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    try {
      setIsLoading(true);
      await axios.post(`${SERVER_URL}/links`, { link:url }, { withCredentials: true });
      setUrl("");
      window.location.reload()
    } catch (error) {
      console.log("🚀 ~ handleSave ~ error:", error)
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Link</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="url" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              URL
            </label>
            <input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition"
              required
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !url}>
              {isLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddLinkDialog;
