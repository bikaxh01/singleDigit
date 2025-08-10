export interface Link {
  url: string;
  title: string;
  summary: string;
  score?:number
  id: string; 
}

export const  SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string