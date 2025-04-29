import { Generated } from "kysely";

export interface AuthUser {
    id: Generated<number>;
    //Generated UUID by default
    apikey: string;
    name: string;
    email: `${string}@${string}`;
    password:string;
    role: "admin"|"user";
    createdAt: Generated<Date|string>
}