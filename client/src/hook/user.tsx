"use client";
import { SERVER_URL } from "@/types";
import axios from "axios";
import React, { useEffect, useState } from "react";

function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true );


  

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${SERVER_URL}/get-user`,{withCredentials:true});
        setUser(res.data.data);
      } catch (error) {
        setUser(null)
        console.log("🚀 ~ getUser ~ error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  return [user, isLoading];
}

export default useUser;
