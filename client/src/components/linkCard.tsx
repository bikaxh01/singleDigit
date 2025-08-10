import { Link } from '@/types'
import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function LinkCard({link}:{link:Link}) {
  return (
   <Dialog>
        <DialogTrigger asChild>
          <div
            className="
              bg-neutral-600 
              rounded-lg 
              shadow 
              p-4 
              cursor-pointer 
              transition 
              hover:bg-neutral-500 
              border 
              border-neutral-700
              flex 
              flex-col
              gap-1
            "
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-lg">{link.title}</h1>
              {typeof link.score === "number" && (
                <span className="ml-2 text-xs bg-neutral-800 text-white px-2 py-0.5 rounded">
                  Score: {link.score.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-xs break-all">{link.url}</span>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{link.title}</DialogTitle>
            <DialogDescription>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {link.url}
              </a>
            </DialogDescription>
          </DialogHeader>
          <div
            className="py-2 text-sm text-neutral-800 dark:text-neutral-200 max-h-40 overflow-y-auto"
          >
            {link.summary}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

export default LinkCard


