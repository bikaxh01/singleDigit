"use client";
import AddLinkDialog from "@/components/addLink";
import LinkCard from "@/components/linkCard";
import SignInDialog from "@/components/signInDialog";
import { Button } from "@/components/ui/button";
import useUser from "@/hook/user";
import { SERVER_URL } from "@/types";
import axios from "axios";
import { setServers } from "dns";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [links, setLinks] = useState([
    {
      url: "https://en.wikipedia.org/wiki/Dog",
      title: "Dog: A Comprehensive Overview",
      score: 0.7615747451782227,
      summary:
        "Dogs remain one of the most studied and beloved animals, featured in art, religion, and mythology across diverse cultures.",
      id: "6898500c88d0be98f75472c1",
    },
    {
      url: "https://en.wikipedia.org/wiki/Cat",
      title: "Cat: History and Characteristics",
      summary:
        "Cats have been domesticated for thousands of years, revered in ancient Egypt and cherished as companions in households worldwide.",
      id: "2c785b1ad7e9e4f632a184d9",
    },
    {
      url: "https://en.wikipedia.org/wiki/Horse",
      title: "Horse: Evolution and Domestication",
      summary:
        "Horses have played a vital role in human history, from transport and agriculture to sports and cultural symbolism.",
      score: 0.7615747451782227,
      id: "dc45a77c27b33f8a1a88ef93",
    },
    {
      url: "https://en.wikipedia.org/wiki/Elephant",
      title: "Elephant: Giants of the Animal Kingdom",
      summary:
        "Elephants are known for their intelligence, strong social bonds, and role in maintaining ecological balance.",
      id: "a5c13f09e4d7b21c71ef562a",
    },
    {
      url: "https://en.wikipedia.org/wiki/Lion",
      title: "Lion: The King of Beasts",
      summary:
        "Lions live in prides and are recognized as symbols of strength, courage, and royalty in many cultures.",
      id: "3f6210d4b97148a6c9d05f8e",
    },
    {
      url: "https://en.wikipedia.org/wiki/Tiger",
      title: "Tiger: Apex Predator of the Forest",
      summary:
        "Tigers are solitary big cats known for their power, stealth, and distinctive striped coats.",
      id: "29b82f6d9d8b4a7fbb50e6ad",
    },
    {
      url: "https://en.wikipedia.org/wiki/Wolf",
      title: "Wolf: Social Hunter",
      summary:
        "Wolves are highly social animals, living and hunting in packs with complex communication systems.",
      id: "f2b3c617aaf048f5ab4b1971",
    },
    {
      url: "https://en.wikipedia.org/wiki/Dolphin",
      title: "Dolphin: Intelligent Marine Mammals",
      summary:
        "Dolphins are celebrated for their intelligence, playful behavior, and complex social structures.",
      id: "5db71fd1d3e54e2cb0c6af92",
    },
    {
      url: "https://en.wikipedia.org/wiki/Eagle",
      title: "Eagle: Majestic Birds of Prey",
      summary:
        "Eagles are powerful birds with keen eyesight, revered as symbols of freedom and strength.",
      id: "b9d6f1f44b024c6e9ef917b4",
    },
    {
      url: "https://en.wikipedia.org/wiki/Penguin",
      title: "Penguin: Flightless Birds of the South",
      summary:
        "Penguins are flightless birds adapted to aquatic life, found primarily in the Southern Hemisphere.",
      id: "4ad71884e6e44d6ebbd4c8a7",
    },
  ]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [user, isLoading] = useUser();

  useEffect(() => {
    getLinks();
  }, []);

  const getLinks = async () => {
    try {
      setQuery("");
      const res = await axios.get(`${SERVER_URL}/links`, {
        withCredentials: true,
      });
      setLinks(res.data.data);
    } catch (error) {
      alert("something went wrong");
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
            {links.map((link) => (
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
