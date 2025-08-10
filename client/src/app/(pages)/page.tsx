"use client";
import AddLinkDialog from "@/components/addLink";
import LinkCard from "@/components/linkCard";
import SignInDialog from "@/components/signInDialog";
import { Button } from "@/components/ui/button";
import useUser from "@/hook/user";
import { Link, SERVER_URL } from "@/types";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [links, setLinks] = useState([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [user, isLoading] = useUser();

  useEffect(() => {
    getLinks();
  }, []);

  const getLinks = async () => {

    console.log("🚀 ~ getLinks ~ user:", user)
    if (user) {
      try {
        setQuery("");
        const res = await axios.get(`${SERVER_URL}/links`, {
          withCredentials: true,
        });
        setLinks(res.data.data);
      } catch (error) {
        alert("something went wrong");
      }
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const res = await axios.get(`${SERVER_URL}/search?query=${query}`, {
        withCredentials: true,
      });

      setLinks(res.data.data);
    } catch (error) {
      console.log("🚀 ~ handleSearch ~ error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 h-full px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full">
          <input
            value={query}
            type="text"
            className="w-full sm:w-[28rem] rounded-md text-xs px-2 border-2 focus:outline-none focus:border-neutral-600"
            placeholder="Enter search query"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <Button
              disabled={!query || isSearching}
              onClick={handleSearch}
              className="flex-1 sm:flex-none min-w-[100px]"
            >
              {isSearching ? (
                <>
                  Searching... <Loader2 className="size-4 animate-spin ml-1" />
                </>
              ) : (
                "search"
              )}
            </Button>
            {query && (
              <Button
                onClick={getLinks}
                className="flex-1 sm:flex-none min-w-[100px]"
              >
                clear search
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-2 sm:mt-0">
          <AddLinkDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="size-12 animate-spin" />
        </div>
      ) : user ? (
        links.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <h1>No links found.</h1>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[70vh] space-y-2">
            {links.map((link:Link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        )
      ) : (
        <div>
          <h1>Sign In </h1>
        </div>
      )}

      <SignInDialog open={isLoading ? false : !user ? true : false} />
    </div>
  );
}
