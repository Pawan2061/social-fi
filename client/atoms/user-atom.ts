import { atom } from "jotai";

interface User {
    id: number;
    name: string;
    email: string | null;
    image: string | null;
    wallet: string;
    onboarded: boolean;
    createdAt: string;
    updatedAt: string;
    passes: Pass[];
    pass: Pass | null;
}

interface Pass {
    id: number;
    creatorId: number;
    title: string;
    description: string;
    price: number;
    image: string | null;
    createdAt: string;
    updatedAt: string;
}



const userAtom = atom<User | null>(null);
export default userAtom;
